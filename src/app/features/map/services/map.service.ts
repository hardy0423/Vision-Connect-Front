import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { environment } from '../../../../environment/environment';
import { IntervetionZoneList, ZoneData } from '../models/zone';
import { TranslateService } from '@ngx-translate/core';
import { Map } from 'ol';
import { DeviceAndZoneInterface } from '../../../data/interfaces/devicezone.interface';
import LayerGroup from 'ol/layer/Group';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private apiUrl = environment.apiUrl;
  private mapDataSubject = new BehaviorSubject<Map | null>(null);
  private vectorDataSubject = new BehaviorSubject<LayerGroup | null>(null);
  private mapCopy: Map | null = null;
  /**
   * Constructor
   * @param {HttpClient} http the httpClient
   */
  constructor(private http: HttpClient) {}

  addGeographicBarrier(data: ZoneData): Observable<ZoneData> {
    return this.http
      .post<ZoneData>(`${this.apiUrl}/${environment.api.map.create}`, data)
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
   * Get all intervetionZone
   * @returns
   */
  getAllInterventionZone(
    uid: string | null
  ): Observable<IntervetionZoneList[]> {
    let params = new HttpParams();

    if (uid) {
      params = params.set('uid', uid);
    }

    return this.http.get<IntervetionZoneList[]>(
      `${this.apiUrl}/${environment.api.map.get_all}`,
      { params }
    );
  }

  /**
   * Delete intervetionZone
   * @returns
   */
  deleteGeographicBarrier(uid: string): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${environment.api.map.delete}${uid}/`)
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  getMapData(): Observable<Map | null> {
    return this.mapDataSubject.asObservable();
  }

  setMapData(data: Map): void {
    if (data instanceof Map) {
      this.mapDataSubject.next(data);
    } else {
      console.error('Invalid Map data');
    }
  }

  getIntervetionZone(uid: string): Observable<IntervetionZoneList> {
    return this.http
      .get<IntervetionZoneList>(
        `${this.apiUrl}/${environment.api.map.get}${uid}/`
      )
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  getVectorGroupData(): Observable<LayerGroup | null> {
    return this.vectorDataSubject.asObservable();
  }

  setVectorGroupData(data: LayerGroup): void {
    if (data instanceof LayerGroup) {
      this.vectorDataSubject.next(data);
    } else {
    }
  }
}
