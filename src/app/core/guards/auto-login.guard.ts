import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { filter, map, take, tap } from 'rxjs';
import { AdminService } from '../auth/services/admin.service';

export const autoLoginGuard: CanActivateFn = (route, state) => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  return adminService.isAuthenticatedSubject.pipe(
    filter((val) => val !== null), // Ensure the value is not null
    take(1),
    map((user) => {
      if (user) {
        router.navigateByUrl('/');
        return false;
      } else {
        return true;
      }
    })
  );
};
