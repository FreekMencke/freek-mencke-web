import { Routes } from '@angular/router';
import { PageMeta } from '@app/common/seo/page-meta.strategy';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    loadComponent: () => import('@app/common/root-layout/root-layout.component'),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Freek Mencke - Doing the coding thing. Creating cool shit.',
        loadComponent: () => import('@app/home/home.component'),
        data: {
          meta: {
            description:
              'Freek Mencke, a full-stack TypeScript developer from Belgium. Builds OSRS Tracker, a Node TS starter CLI and the Kubernetes cluster that runs this site.',
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
