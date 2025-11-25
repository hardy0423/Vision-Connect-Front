import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environment/environment';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  tap,
  throwError,
} from 'rxjs';
import { Country } from '../models/country.interface';
import {
  CompanyInterface,
  CompanyResponse,
} from '../../../data/interfaces/company.interface';
import { response } from 'express';

@Injectable({
  providedIn: 'root',
})
export class CompanyService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private saveDeviceInfoSubject = new BehaviorSubject<boolean | null>(null);
  private companyDataSource = new BehaviorSubject<CompanyResponse | null>(null); // Données initiales à null
  companyData$: Observable<CompanyResponse | null> =
    this.companyDataSource.asObservable(); // Observable pour écouter les changements
  private companyeDataSubject = new BehaviorSubject<CompanyResponse | null>(
    null
  );

  getCountries(): Observable<Country[]> {
    return this.http
      .get<Country[]>(
        `${this.apiUrl}/${environment.api.companies.country_list}`
      )
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  getCompanyList(): Observable<CompanyInterface[]> {
    return this.http
      .get<CompanyInterface[]>(
        `${this.apiUrl}/${environment.api.companies.list}`
      )
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  getCompanyById(uid: string): Observable<CompanyInterface> {
    return this.http
      .get<CompanyInterface>(
        `${this.apiUrl}/${environment.api.companies.get}${uid}/`
      )
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  createCompany(company: CompanyInterface): Observable<any> {
    return this.http
      .post<CompanyInterface>(
        `${this.apiUrl}/${environment.api.companies.create}`,
        company
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  updateCompany(company: CompanyInterface): Observable<any> {
    return this.http
      .put<CompanyInterface>(
        `${this.apiUrl}/${environment.api.companies.update}${company.uid}/`,
        company
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  deleteCompany(uid: string | undefined): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${environment.api.companies.delete}${uid}/`)
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  restoreCompany(uid: string | undefined): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${environment.api.companies.restore}${uid}/`)
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    const params = new HttpParams().set('email', email);
    return this.http
      .get<any>(`${this.apiUrl}/${environment.api.companies.email_exist}`, {
        params,
      })
      .pipe(map((isExist) => isExist.exists));
  }

  handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      error.status === 401
        ? "Vous n'êtes pas autorisé à effectuer cette action."
        : 'Une erreur est survenue. Veuillez réessayer.';
    return throwError(() => new Error(message));
  }

  checkSommeTotalDevice(number: number, email: string): Observable<any> {
    const params = new HttpParams().set('number', number).set('email', email);

    return this.http.get<any>(
      `${this.apiUrl}/${environment.api.companies.check_device_number}`,
      { params }
    );
  }

  setSaveCompanyInfo(isSave: boolean) {
    this.saveDeviceInfoSubject.next(isSave);
  }

  getSaveCompanyInfo(): Observable<boolean | null> {
    return this.saveDeviceInfoSubject.asObservable();
  }

  getListCompanyTable(
    uid: string | null,
    limit: number = 10,
    offset: number = 0
  ): Observable<CompanyResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
    if (uid) {
      params = params.set('uid', uid);
    }


    return this.http
      .get<CompanyResponse>(
        `${this.apiUrl}/${environment.api.companies.list}`,
        { params }
      )
      .pipe(
        tap((response) => this.setCompanyData(response)),
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  setCompanyData(data: CompanyResponse) {
    this.companyeDataSubject.next(data);
  }

  getCompanyData(): Observable<CompanyResponse | null> {
    return this.companyeDataSubject.asObservable();
  }

  saveLogoCompany(
    base64Image: string | ArrayBuffer,
    idCompany: string
  ): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/${environment.api.companies.add_image}${idCompany}/`,
        {
          image: base64Image,
        }
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  updateTotalDevice(total: number): Observable<CompanyInterface> {
    return this.http.put<CompanyInterface>(
      `${this.apiUrl}/${environment.api.companies.update_device_fmap}`,
      {
        total_device: total,
      }
    );
  }
}
