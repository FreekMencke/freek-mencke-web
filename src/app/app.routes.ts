import { Routes } from '@angular/router';
import { PageMeta } from './common/seo/page-meta.strategy';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    loadComponent: () => import('./common/root-layout/root-layout.component'),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Freek Mencke - Doing the coding thing. Creating cool shit.',
        loadComponent: () => import('./home/home.component'),
        data: {
          meta: {
            description:
              'Freek Mencke is a JavaScript/TypeScript developer, Angular expert, and passionate coder creating cool projects like OSRS Tracker and bringing ideas to life.',
            canonicalPath: '/',
          } satisfies PageMeta,
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
