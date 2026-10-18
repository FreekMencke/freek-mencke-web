import { isDevMode } from '@angular/core';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { metricsMiddleware } from '@osrs-tracker/express-metrics';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { randomBytes } from 'node:crypto';
import type { Server } from 'node:http';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// The Dockerfile and freek-mencke-web.yaml set these; the defaults are for `npm run serve:ssr:freek-mencke-web`
const PORT = Number(process.env['PORT'] || 8080);
const METRICS_PORT = Number(process.env['METRICS_PORT'] || 9090);
// The only host Angular renders for, against server-side request forgery
const HOST = process.env['HOST'] || 'localhost';
// The X-Forwarded-* headers Traefik sets and overwrites when clients send them
const TRUST_PROXY_HEADERS = process.env['TRUST_PROXY_HEADERS']?.split(',') || [];
// Above Traefik's 90 s idle timeout for backend connections, so Traefik is the one that closes an idle connection.
// With Node's 5 s default, Node can close one just as Traefik sends a request on it, which Traefik answers with a 502.
const KEEP_ALIVE_TIMEOUT = 95_000;

const browserDistFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../browser');
// The build hashes the names of the bundles it writes to the root, so a changed bundle gets a new URL
const HASHED_FILE = /^\/[^/]+\.(?:js|css)$/;
// Any path with a file extension: the static files are served before this is checked
const FILE_PATH = /\.[^/]+$/;
// `ngCspNonce` on `<app-root>` in index.html: the build copies it onto the page's scripts and the pre-render onto the
// ones it adds, and each response swaps it for its own nonce (see `withNonce`)
const NONCE_PLACEHOLDER = /\b(nonce|ngcspnonce)="CSP_NONCE_PLACEHOLDER"/gi;
// Turns off the browser features the page never uses, for itself and anything it embeds. Helmet doesn't set this
// header. Only features Chrome knows: it logs an error for each name it doesn't.
const PERMISSIONS_POLICY = [
  'accelerometer',
  'browsing-topics',
  'camera',
  'display-capture',
  'geolocation',
  'gyroscope',
  'hid',
  'magnetometer',
  'microphone',
  'midi',
  'payment',
  'serial',
  'usb',
]
  .map(feature => `${feature}=()`)
  .join(', ');

const app = express();
// Traefik is the only hop in front of the app and overwrites any client-sent X-Forwarded-For, so req.ip is the client
app.set('trust proxy', 1);
app.disable('x-powered-by');
const metricsApp = express();
const angularApp = new AngularNodeAppEngine({ allowedHosts: [HOST], trustProxyHeaders: TRUST_PROXY_HEADERS });

const healthy = (_req: Request, res: Response) => void res.send('OK');
// Readiness probe on the main port, before the metrics so probes don't show up in them
app.get('/healthy', healthy);
// Liveness probe on the metrics port, which keeps answering while the main server drains on shutdown
metricsApp.get('/healthy', healthy);

app.use(
  // GET /metrics on the metrics port. The path label is `/`, `/static` or `#unmatched`, so every path a bot tries
  // doesn't become its own time series.
  metricsMiddleware({
    metricsApp,
    normalizePath: (req, res) =>
      req.path === '/' ? '/' : FILE_PATH.test(req.path) && res.statusCode < 400 ? '/static' : '#unmatched',
  }),
);

// A fresh nonce for every response, for the CSP header below and the page (`withNonce`)
app.use((_req, res, next) => {
  res.locals['cspNonce'] = randomBytes(16).toString('base64');
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Scripts need the response's nonce, or must be added by one that has it: 'strict-dynamic' makes current
        // browsers ignore 'self', which only older ones still use. The dev server leaves it out, as the Vite client
        // script it adds has no nonce.
        scriptSrc: [
          "'self'",
          (_req, res) => `'nonce-${(res as Response).locals['cspNonce']}'`,
          ...(isDevMode() ? [] : ["'strict-dynamic'"]),
        ],
        scriptSrcAttr: ["'none'"],
        // Angular's component styles and the tagline's `style` attributes are inline
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        workerSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    // Lets the linked sites (OSRS Tracker's analytics) see a visit came from here, without the path
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    // Only this host: includeSubDomains would hold every *.freekmencke.com host, some served elsewhere, to HTTPS for a
    // year
    strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: false },
  }),
  (_req, res, next) => {
    res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
    next();
  },
);

// Hashed bundles are cached for a year, everything else (fonts, images, robots.txt, security.txt) for a day.
// Compression is left to Traefik (freek-mencke-web.yaml).
const staticOptions: Parameters<typeof express.static>[1] = {
  index: false,
  cacheControl: false,
  setHeaders: (res, path) => {
    const url = '/' + relative(browserDistFolder, path).split(sep).join('/');
    if (HASHED_FILE.test(url)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else res.setHeader('Cache-Control', 'public, max-age=86400');
  },
};
app.use(express.static(browserDistFolder, staticOptions));
// express.static skips dot-folders, so `.well-known` (security.txt) gets a root of its own. Other dotfiles stay hidden.
app.use('/.well-known', express.static(join(browserDistFolder, '.well-known'), staticOptions));

// A missing file gets a 404 instead of the redirect to `/`: a stale bundle name would otherwise get the page as script
app.use((req, res, next) => (FILE_PATH.test(req.path) ? void res.status(404).send('Not Found') : next()));

// The pre-rendered page, and a redirect to it for every other path. Express 5 passes a rejected promise on to the
// error handler below.
app.use(async (req, res, next) => {
  // Each response has its own nonce, so a 304 would revive a cached page whose nonce the new CSP header doesn't allow
  delete req.headers['if-none-match'];
  const response = await angularApp.handle(req);
  if (!response) return next();
  return writeResponseToNodeResponse(await withNonce(response, res.locals['cspNonce']), res);
});

// Log errors and respond with a generic 500: Express' default handler leaks the stack trace unless NODE_ENV=production
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('%s %s failed', req.method, req.originalUrl, err); // eslint-disable-line no-console
  if (res.headersSent) return next(err);
  res.status(500).send('Internal Server Error');
});

if (isMainModule(import.meta.url)) {
  const server = app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`)); // eslint-disable-line no-console
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT;
  const metricsServer = metricsApp.listen(METRICS_PORT);

  // Node as PID 1 ignores SIGTERM without a handler, so Kubernetes would kill it only after the 30 s grace period
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      closeServers(server, metricsServer).then(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    });
  }
}

/**
 * The page with its nonce placeholders swapped for the response's nonce, only inside nonce attributes so the content is
 * never touched. Without its ETag, as its body changes with every response, and fetched again on every visit, so a
 * deploy is live at once. Other responses (the redirect to `/`) pass as they are.
 */
async function withNonce(response: globalThis.Response, nonce: string): Promise<globalThis.Response> {
  if (!response.headers.get('content-type')?.startsWith('text/html')) return response;

  const html = (await response.text()).replace(NONCE_PLACEHOLDER, `$1="${nonce}"`);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('etag');
  if (!headers.has('cache-control')) headers.set('cache-control', 'no-cache');
  return new globalThis.Response(html, { status: response.status, headers });
}

/** Closes the main server, then the metrics server, resolving once both have closed */
async function closeServers(server: Server, metricsServer: Server): Promise<void> {
  // `close` only closes the connections that are idle right now. With the long keep-alive timeout, a connection whose
  // response is still being sent would then stay open, so close connections as they become idle.
  const closeIdle = setInterval(() => server.closeIdleConnections(), 100);
  await new Promise(resolve => server.close(resolve));
  clearInterval(closeIdle);
  await new Promise(resolve => metricsServer.close(resolve));
}

/** The request handler used by the Angular CLI (for dev-server and during build) */
export const reqHandler = createNodeRequestHandler(app);
