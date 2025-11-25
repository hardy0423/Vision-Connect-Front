import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { environment } from '../../../environment/environment';

export const notAccessGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  try {
    const token = localStorage.getItem(environment.tokenNameAccess);
    if (token) {
      router.navigate(['']);
      return of(false);
    } else {
      return of(true);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du token', error);
    return of(false);
  }
};