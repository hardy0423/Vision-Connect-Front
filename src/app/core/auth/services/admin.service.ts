import { HttpClient } from '@angular/common/http';
import { Inject, inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  tap,
  throwError,
} from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environment/environment';
import { UserInterface } from '../../../data/interfaces/user.interface';
import { jwtDecode } from 'jwt-decode';
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  // Injection des services
  private http = inject(HttpClient);
  private router = inject(Router);

  // URL de l'API
  private apiUrl = environment.apiUrl;

  // Comportements des sujets
  currentUserSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  isAuthenticatedSubject: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  // État de chargement
  loading: boolean = true;

  storage: Storage;

  constructor() {
    this.storage = localStorage
    this.loadToken();
  }

  private loadToken(): void {
    try {
      const token = this.storage.getItem(environment.tokenNameAccess);
      if (token) {
        this.isAuthenticatedSubject.next(true);
      } else {
        this.isAuthenticatedSubject.next(false);
      }
    } catch (error) {
      this.isAuthenticatedSubject.next(false);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Login User
   * @method POST
   * @param user
   * @returns Observable<any>
   */
  login(user: UserInterface): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/${environment.api.accounts.login}`, user)
      .pipe(
        tap((response: any) => {
          this.storage.setItem(
            environment.tokenNameAccess,
            response.accessToken
          );
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(response);
          this.router.navigateByUrl('', { replaceUrl: true });
        }),
        catchError((error) => {
          return throwError(() => new Error(error));
        })
      );
  }
  /**
   * Logout the user
   * @returns Observable<void>
   */
  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/${environment.api.accounts.logout}`, {})
      .pipe(
        tap(() => {
          this.storage.removeItem(environment.tokenNameAccess);
          this.isAuthenticatedSubject.next(false);
          this.currentUserSubject.next(null);
          this.router.navigateByUrl('/auth/login', { replaceUrl: true });
        }),
        catchError((error) => {
          console.error('Logout failed:', error);
          throw error;
        })
      );
  }

  /**
   * Update user password
   * @param user - User object with password details
   * @returns Observable<any>
   */
  updateUserPassword(user: UserInterface): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/${environment.api.accounts.default_password_change}`,
        user
      )
      .pipe(
        tap(() => {
          this.storage.removeItem(environment.tokenNameAccess);
          this.isAuthenticatedSubject.next(false);
          this.currentUserSubject.next(null);
          this.router.navigateByUrl('/auth/login', { replaceUrl: true });
        }),
        catchError((error) => {
          console.error('Password update failed:', error);
          return of(null);
        })
      );
  }

  getToken(): string | null {
    return this.storage.getItem(environment.tokenNameAccess);
  }

  getUserFromToken(): any {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        return decodedToken;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * is authenticated
   * @returns boolean
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);
      const expirationDate = decodedToken.exp * 1000;
      const currentDate = new Date().getTime();
      return currentDate < expirationDate;
    }
    return false;
  }
}
