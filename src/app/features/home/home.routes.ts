import { Routes } from '@angular/router';
import { accessGuard } from '../../core/guards/access.guard';
import { AdministrationComponent } from '../administration/component/administration.component';
import { ClientComponent } from './component/home.component';
import { DeviceComponent } from '../device/components/device.component';
import { HomeComponent } from '../map/components/map-home/map-home.component';
import { RapportComponent } from '../report/components/report.component';
import { NotificationTableComponent } from '../notification/components/notification-table/notification-table.component';

export const CLIENT_ROUTES: Routes = [
  {
    path: '',
    component: ClientComponent,
    canActivate: [accessGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: '',
      },
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'administration/:uid',
        component: AdministrationComponent,
      },
      {
        path: 'admin',
        component: AdministrationComponent,
      },
      {
        path: 'device/:uid',
        component: DeviceComponent,
      },

      {
        path: 'rapport/:uid',
        component: RapportComponent,
      },
      {
        path: 'notifications/:uid',
        component: NotificationTableComponent,
      },
    ],
  },
];
