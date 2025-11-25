import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/home/home.routes').then((m) => m.CLIENT_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./core/auth/components/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./shared/error/error-404.component').then(
        (m) => m.Error404Component
      ),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
