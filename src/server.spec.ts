// @vitest-environment node
import type { IncomingHttpHeaders, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, expect, it, vi } from 'vitest';
import { reqHandler } from './server';

// The real engine needs a server build: this is about the Express app around it
const { handle } = vi.hoisted(() => ({
  handle: vi.fn<(req: { headers: IncomingHttpHeaders }) => Promise<Response>>(),
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

const server = createServer(reqHandler).listen(0);
afterAll(() => new Promise(resolve => server.close(resolve)));

it('gives each page response a fresh nonce that matches its CSP header, and no ETag', async () => {
  const page =
    '<app-root ngcspnonce="CSP_NONCE_PLACEHOLDER"></app-root><script nonce="CSP_NONCE_PLACEHOLDER"></script>';
  handle.mockImplementation(
    async () => new Response(page, { headers: { 'content-type': 'text/html', 'etag': '"page"' } }),
  );

  const nonces = [];
  for (let i = 0; i < 2; i++) {
    const res = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`, {
      headers: { 'if-none-match': '"page"' },
    });
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
