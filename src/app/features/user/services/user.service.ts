import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environment/environment';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import {
  UserInterface,
  UserWithCompanyDetailInterface,
} from '../../../data/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  private saveUserInfoSubject = new BehaviorSubject<boolean | null>(null);

  getListDevices(): Observable<UserInterface[]> {
    return this.http
      .get<UserInterface[]>(
        `${this.apiUrl}/${environment.api.accounts.user.list}`
      )
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    const params = new HttpParams().set('email', email);
    return this.http
      .get<any>(`${this.apiUrl}/${environment.api.accounts.email_exist}`, {
        params,
      })
      .pipe(map((isExist) => isExist.exists));
  }

  createUser(user: UserInterface): Observable<any> {
    return this.http
      .post<UserInterface>(
        `${this.apiUrl}/${environment.api.accounts.user.create}`,
        user
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  updateUser(user: UserInterface): Observable<any> {
    return this.http
      .put<UserInterface>(
        `${this.apiUrl}/${environment.api.accounts.user.update}${user.uid}/`,
        user
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  deleteUser(uid: string | undefined): Observable<any> {
    return this.http
      .delete<any>(
        `${this.apiUrl}/${environment.api.accounts.user.delete}${uid}/`
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  restoreUser(uid: string | undefined): Observable<any> {
    return this.http
      .delete<any>(
        `${this.apiUrl}/${environment.api.accounts.user.restore}${uid}/`
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      error.status === 401
        ? "Vous n'êtes pas autorisé à effectuer cette action."
        : 'Une erreur est survenue. Veuillez réessayer.';

    return throwError(() => new Error(message));
  }

  /**
   * Get user by slug
   * @returns
   */
  getUserSlug(slug: string): Observable<UserInterface> {
    return this.http.get<UserInterface>(
      `${this.apiUrl}/${environment.api.accounts.user_by_slug}/${slug}`
    );
  }

  getUser(): Observable<UserWithCompanyDetailInterface> {
    return this.http.get<UserWithCompanyDetailInterface>(
      `${this.apiUrl}/${environment.api.accounts.user.get}`
    );
  }

  getListUserTable(
    uid: string | null,
    limit: number = 10,
    offset: number = 0
  ): Observable<any> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (uid) {
      params = params.set('uid', uid);
    }

    return this.http
      .get<any>(`${this.apiUrl}/${environment.api.accounts.user.list}`, {
        params,
      })
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  editUserProfileWithPassword(user: UserInterface): Observable<UserInterface> {
    return this.http
      .put<UserInterface>(
        `${this.apiUrl}/${environment.api.accounts.user.update_profile}${user.uid}/`,
        user
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleErrorProfile(error))
      );
  }

  private handleErrorProfile(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '';
    if (error.error && error.error.errors) {
      errorMessage = error.error.errors;
    } else if (error.status === 0) {
      errorMessage = 'Erreur réseau : impossible de contacter le serveur.';
    }
    return throwError(() => new Error(errorMessage));
  }

  getUserInformation(): Observable<UserInterface> {
    return this.http.get<UserInterface>(
      `${this.apiUrl}/${environment.api.accounts.user.get}`
    );
  }

  getUserFmapInformation(): Observable<UserInterface> {
    return this.http.get<UserInterface>(
      `${this.apiUrl}/${environment.api.accounts.user.get_fmap}`
    );
  }


  createAdministrator(user: UserInterface): Observable<any> {
    return this.http
      .post<UserInterface>(
        `${this.apiUrl}/${environment.api.accounts.user.create}`,
        user
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  /**
   * Send mail for user forget password
   * @param user User
   * @param id number
   * @returns
   */
  userForgotPassword(email: string) {
    return this.http.post<string>(
      `${this.apiUrl}/${environment.api.accounts.forgot_password}`,
      { email }
    );
  }

  setSaveUserInfo(isSave: boolean) {
    this.saveUserInfoSubject.next(isSave);
  }

  getSaveUserInfo(): Observable<boolean | null> {
    return this.saveUserInfoSubject.asObservable();
  }
}
