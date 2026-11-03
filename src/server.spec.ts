// @vitest-environment node
import type { IncomingHttpHeaders, ServerResponse } from 'node:http';
import { rmSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, expect, it, vi } from 'vitest';
import { reqHandler } from './server';

// The real engine needs a server build: this is about the Express app around it
const { handle, fixture } = vi.hoisted(() => ({
  handle: vi.fn<(req: { headers: IncomingHttpHeaders }) => Promise<Response | null>>(),
  fixture: { root: '' },
}));
vi.mock('@angular/ssr/node', () => ({
  AngularNodeAppEngine: class {
    handle = handle;
  },
  createNodeRequestHandler: (app: unknown) => app,
  isMainModule: () => false,
  writeResponseToNodeResponse: async (response: Response, res: ServerResponse) => {
    response.headers.forEach((value, name) => res.setHeader(name, value));
    res.writeHead(response.status).end(await response.text());
  },
}));

// server.ts serves the static files from `../browser` next to itself, which only a build has: point it at a temporary
// folder with one file of each kind instead
vi.mock('node:url', async importOriginal => {
  const url = await importOriginal<typeof import('node:url')>();
  const { mkdirSync, mkdtempSync, writeFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { tmpdir } = await import('node:os');

  const root = (fixture.root = mkdtempSync(join(tmpdir(), 'server-spec-')));
  const browser = join(root, 'browser');
  mkdirSync(join(browser, '.well-known'), { recursive: true });
  for (const file of ['main-ABC123.js', 'og.png', 'favicon.svg', '.well-known/security.txt'])
    writeFileSync(join(browser, file), file);

  // The test build bundles server.ts into this spec, so its `import.meta.url` is this file's
  const fileURLToPath = (path: string | URL) =>
    /\/src\/server(\.spec)?\.ts$/.test(String(path)) ? join(root, 'server', 'server.mjs') : url.fileURLToPath(path);
  return { ...url, default: { ...url, fileURLToPath }, fileURLToPath };
});

const server = createServer(reqHandler).listen(0);
afterAll(async () => {
  await new Promise(resolve => server.close(resolve));
  rmSync(fixture.root, { recursive: true });
});

const get = (path: string, init?: RequestInit) =>
  fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`, { redirect: 'manual', ...init });

it('gives each page response a fresh nonce that matches its CSP header, and no ETag', async () => {
  const page =
    '<app-root ngcspnonce="CSP_NONCE_PLACEHOLDER"></app-root><script nonce="CSP_NONCE_PLACEHOLDER"></script>';
  handle.mockImplementation(
    async () => new Response(page, { headers: { 'content-type': 'text/html', 'etag': '"page"' } }),
  );

  const nonces = [];
  for (let i = 0; i < 2; i++) {
    const res = await get('/', { headers: { 'if-none-match': '"page"' } });
    const nonce = res.headers.get('content-security-policy')!.match(/'nonce-([^']+)'/)![1];

    expect(await res.text()).toBe(page.replaceAll('CSP_NONCE_PLACEHOLDER', nonce));
    expect(res.headers.get('etag')).toBeNull();
    expect(res.headers.get('cache-control')).toBe('no-cache');
    nonces.push(nonce);
  }
  expect(new Set(nonces).size).toBe(2);
  // A matching ETag would make Angular answer 304, reviving the browser's copy with an old nonce
  expect(handle.mock.calls.map(([req]) => req.headers['if-none-match'])).toEqual([undefined, undefined]);
});

it('caches hashed bundles and the link-preview card for a year, other files for a day', async () => {
  const bundle = await get('/main-ABC123.js');
  const card = await get('/og.png');
  const icon = await get('/favicon.svg');

  expect([bundle.status, card.status, icon.status]).toEqual([200, 200, 200]);
  expect(bundle.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  expect(card.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  expect(icon.headers.get('cache-control')).toBe('public, max-age=86400');
  // Preview tools show the card in their own page
  expect(card.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
  expect(bundle.headers.get('cross-origin-resource-policy')).toBe('same-origin');
});

it('serves .well-known, which express.static skips as a dot-folder', async () => {
  const res = await get('/.well-known/security.txt');

  expect(res.status).toBe(200);
  expect(await res.text()).toBe('.well-known/security.txt');
  expect(res.headers.get('cache-control')).toBe('public, max-age=86400');
});

it('answers a missing file with a 404 instead of the page', async () => {
  handle.mockClear();

  const res = await get('/main-OLD456.js');

  expect(res.status).toBe(404);
  expect(handle).not.toHaveBeenCalled();
});

it("passes the engine's redirect for an unknown page on as it is", async () => {
  handle.mockImplementation(async () => new Response(null, { status: 302, headers: { location: '/' } }));

  const res = await get('/unknown');

  expect(res.status).toBe(302);
  expect(res.headers.get('location')).toBe('/');
});

it('answers an error with a generic 500, without the stack trace', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  handle.mockRejectedValue(new Error('engine broke'));

  const res = await get('/');
  const body = await res.text();

  expect(res.status).toBe(500);
  expect(body).toBe('Internal Server Error');
  expect(body).not.toContain('engine broke');
  expect(error).toHaveBeenCalledWith('%s %s failed', 'GET', '/', expect.any(Error));
  error.mockRestore();
});

it('sends the CSP with a nonce and the Permissions-Policy on every response', async () => {
  const res = await get('/favicon.svg');

  expect(res.headers.get('content-security-policy')).toMatch(/script-src 'self' 'nonce-[^']+'/);
  expect(res.headers.get('permissions-policy')).toContain('camera=()');
});
