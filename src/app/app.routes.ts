import { Routes } from '@angular/router';
import RootLayoutComponent from './common/root-layout/root-layout.component';
import HomeComponent from './home/home.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'prefix',
    component: RootLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: HomeComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/',
  },
];
