import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // The only page, rendered at build time
  { path: '', renderMode: RenderMode.Prerender },
  // Every other path redirects to `/` (app.routes.ts), as a 302 from the server
  { path: '**', renderMode: RenderMode.Server },
];
