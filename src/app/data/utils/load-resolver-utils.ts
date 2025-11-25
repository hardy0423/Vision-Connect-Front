import { inject, Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class LoadResolver implements Resolve<boolean> {
  constructor(private router: Router) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> {
    const token = localStorage.getItem(environment.tokenNameAccess);

    return of(token).pipe(
      delay(500), // Simule un délai pour l'effet visuel ou la logique asynchrone
      tap((user) => {
        if (!user) {
          this.router.navigate(['/auth/login']);
        }
      })
    );
  }
}
