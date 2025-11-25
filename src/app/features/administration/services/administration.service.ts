import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { UserInterface } from '../../../data/interfaces/user.interface';
import { CompanyInterface } from '../../../data/interfaces/company.interface';


@Injectable({
  providedIn: 'root',
})
export class AdministrationService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  

  constructor() {}

  getListTable(
    type: 'company' | 'user'
  ): Observable<UserInterface[] | CompanyInterface[]> {
    let api = '';
    if (type === 'company') {
      api = environment.api.companies.list;
    } else {
      api = environment.api.accounts.user.list;
    }
    return this.http
      .get<UserInterface[] | CompanyInterface[]>(`${this.apiUrl}/${api}`)
      .pipe(
        map((response) => {
          return response
        }),
        catchError((error) => this.handleError(error))
      );
  }

  private handleError(error: any) {
    // Vous pouvez gérer les erreurs ici comme vous le souhaitez
    console.error('An error occurred:', error);
    return throwError(
      () => new Error('Something went wrong; please try again later.')
    );
  }
}
