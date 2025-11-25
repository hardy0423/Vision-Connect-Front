import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environment/environment';
import { UserInterface } from '../interfaces/user.interface';


@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  

  constructor() {}

  getUser(): Observable<UserInterface[]> {
    return this.http.get<UserInterface[]>(
      `${this.apiUrl}/${environment.api.accounts.user.get}`
    );
  }



  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
