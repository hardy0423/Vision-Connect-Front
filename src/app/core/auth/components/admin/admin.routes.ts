import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { LoginComponent } from '../login/login.component';
import { Error404Component } from '../../../../shared/error/error-404.component';
import { autoLoginGuard } from '../../../guards/auto-login.guard';
import { PasswordChangeGuard } from '../../../guards/password-change.guard';
import { ResetPasswordComponent } from '../reset-password/reset-password.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [autoLoginGuard],
      },
      {
        path: "login/:slug",
        component: LoginComponent,
        canActivate: [PasswordChangeGuard],
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        canActivate: [autoLoginGuard],
      },
    ],
  },
  {
    path: '**',
    component: Error404Component,
  },
];
