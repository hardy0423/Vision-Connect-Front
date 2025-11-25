import {
  HttpHandlerFn,
  HttpRequest,
  HttpInterceptorFn,
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpClient,
} from '@angular/common/http';
import { catchError, Observable, switchMap, take, tap, throwError } from 'rxjs';
import { environment } from '../../../environment/environment';
import { inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

export const httpRequestInterceptorFn: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const http = inject(HttpClient);
  const token = localStorage?.getItem(environment.tokenNameAccess);

  if (req.url.endsWith('/api/accounts/token-verify/')) {
    return next(req);
  }

  if (token) {
    return  http.get(`${environment.apiUrl}/${environment.api.accounts.token_verify}`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .pipe(
        switchMap(() => {
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Token ${token}`,
              Accept: '*/*',
            },
          });
          return next(authReq);
        }),
        catchError((error) => {
          if (error.status === 401) {
            localStorage.removeItem(environment.tokenNameAccess);
          }
          throw error;
        })
      );
  } else {
    return next(req);
  }
};
