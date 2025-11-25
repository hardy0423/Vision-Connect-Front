import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environment/environment';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Location, ReportInterface } from '../models/rapport.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  getReportList(): Observable<ReportInterface[]> {
    return this.http
      .get<ReportInterface[]>(`${this.apiUrl}/${environment.api.report.list}`)
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      error.status === 401
        ? "Vous n'êtes pas autorisé à effectuer cette action."
        : 'Une erreur est survenue. Veuillez réessayer.';

    return throwError(() => {
      new Error(message)
    });
  }

  getTrajectoryTiles(
    deviceId: string,
    z: number,
    x: number,
    y: number
  ): Observable<ArrayBuffer> {
    const url = `${this.apiUrl}/itinerary/${deviceId}/${z}/${x}/${y}`;
    return this.http.get(url, { responseType: 'arraybuffer' });
  }

  getDevicePosition(uid: string, dateTrajectory:string): Observable<Location> {
    const params = new HttpParams().set('date', dateTrajectory);
    return this.http
      .get<Location>(`${this.apiUrl}/${environment.api.devices.get_position}${uid}/`, {
        params
      })
      .pipe(
        map((response: Location) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }
}
