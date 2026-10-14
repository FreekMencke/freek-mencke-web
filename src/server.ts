import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { metricsMiddleware } from '@osrs-tracker/express-metrics';
import express, { NextFunction, Request, Response } from 'express';
import type { Server } from 'node:http';
import { dirname, relative, resolve, sep } from 'node:path';
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

// Hashed bundles are cached for a year, everything else (fonts, images, robots.txt) for a day. Compression is left to
// Traefik (freek-mencke-web.yaml).
app.use(
  express.static(browserDistFolder, {
    index: false,
    cacheControl: false,
    setHeaders: (res, path) => {
      const url = '/' + relative(browserDistFolder, path).split(sep).join('/');
      if (HASHED_FILE.test(url)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      else res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  }),
);

// A missing file gets a 404 instead of the redirect to `/`: a stale bundle name would otherwise get the page as script
app.use((req, res, next) => (FILE_PATH.test(req.path) ? void res.status(404).send('Not Found') : next()));

// The pre-rendered page, and a redirect to it for every other path. Express 5 passes a rejected promise on to the
// error handler below.
app.use(async (req, res, next) => {
  const response = await angularApp.handle(req);
  if (!response) return next();
  // Revalidated on every visit (with the ETag Angular sets), so a deploy is live at once
  if (!response.headers.has('cache-control')) res.setHeader('Cache-Control', 'no-cache');
  return writeResponseToNodeResponse(response, res);
});

// Log errors and respond with a generic 500: Express' default handler leaks the stack trace unless NODE_ENV=production
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(`${req.method} ${req.originalUrl} failed`, err); // eslint-disable-line no-console
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
