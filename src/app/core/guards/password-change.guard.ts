import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, map, Observable, of, take } from 'rxjs';
import { UserService } from '../../features/user/services/user.service';



@Injectable({
  providedIn: 'root'
})
export class PasswordChangeGuard implements CanActivate {
  private userService = inject(UserService);

  constructor(private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const slug = next.paramMap.get('slug');
    if (slug) {
      return this.userService.getUserSlug(slug).pipe(
        take(1),
        map(user => {
          if (user.password_changed) {
            this.router.navigate(['/auth/login']);
            return false; 
          }
          return true;
        }),
        catchError(() => {
          this.router.navigate(['/auth/login']);
          return of(false);
        })
      );
    }

    return of(true);  // Si aucun slug, l'accès est autorisé
  }
}