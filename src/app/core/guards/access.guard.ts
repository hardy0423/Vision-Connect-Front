import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoadingService } from '../../data/services/loading.service';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { AdminService } from '../auth/services/admin.service';

export const accessGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const adminService = inject(AdminService);
  const loadingService = inject(LoadingService);

  loadingService.setLoading(true);

  return adminService.isAuthenticatedSubject.pipe(
    filter((val) => val !== null),
    take(1),
    map((user) => {
      loadingService.setLoading(false);
      if (user) {
        return true;
      } else {
        router.navigate(['/auth','login'])
        return false;
      }
    })
  );
};
