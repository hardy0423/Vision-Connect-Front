import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take, tap } from 'rxjs';
import { AdminService } from '../auth/services/admin.service';

export const authGuard: CanActivateFn = (route, state) => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  return adminService.isAuthenticatedSubject.pipe(
    filter((val) => val !== null),
    take(1),
    map((user) => {
      if (user) {
        return true;
      } else {
        router.navigateByUrl('/auth/login');
        return false;
      }
    })
  );
};
