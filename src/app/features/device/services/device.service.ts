import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  map,
  Observable,
  of,
  throwError,
} from 'rxjs';
import { environment } from '../../../../environment/environment';
import { CompanyInterface } from '../../../data/interfaces/company.interface';
import { DeviceTypeInterface } from '../../../data/interfaces/device-type.interface';
import { ServerInterface } from '../../../data/interfaces/server.interface';
import { DeviceLocationDataInterface } from '../../../data/interfaces/device-location-data.interface';
import {
  CommandeEngineImmobilizerResponse,
  CommandeInfoResponse,
  CommandePositionInfoResponse,
  CommandeStatusInfoResponse,
  Device,
  DeviceAndZoneInterface,
  DeviceCommand,
  DeviceInfo,
  DeviceResponse,
  DeviceStatus,
  DeviceType,
} from '../models/device';
import { IntervetionZoneList } from '../../map/models/zone';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);
  private deviceData?: Device;
  private deviceDataSubject = new BehaviorSubject<Device | null>(null);
  private saveDeviceInfoSubject = new BehaviorSubject<boolean | null>(null);
  private canAddDeviceSubject = new BehaviorSubject<boolean | null>(null);

  getListDevices(uid: string): Observable<DeviceResponse> {
    const params = new HttpParams().set('uid', uid);
    return this.http
      .get<DeviceResponse>(`${this.apiUrl}/${environment.api.devices.list}`, {
        params,
      })
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  getListDevicesFilter(uid: string, filter?: string, pageIndex: number = 0, pageSize: number = 10): Observable<DeviceResponse> {
    let params = new HttpParams()
      .set('uid', uid)
      .set('limit', pageSize.toString())
      .set('offset', pageIndex.toString());

  
    if (filter !== undefined) {
      params = params.set('active', filter);
    }
    
    return this.http
      .get<DeviceResponse>(`${this.apiUrl}/${environment.api.devices.list}`, { params })
      .pipe(
        map((response) => response),
        catchError((error) => {
  
         return this.handleError(error)
        })
      );
  }

  getDeviceByUid(uid: string): Observable<Device> {
    return this.http
      .get<Device>(`${this.apiUrl}/${environment.api.devices.get}${uid}/`)
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  getDeviceByImei(imei: string): Observable<Device> {
    return this.http
      .get<Device>(`${this.apiUrl}/${environment.api.devices.get}${imei}/`)
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  getCompanies(): Observable<CompanyInterface[]> {
    return this.http.get<CompanyInterface[]>(
      `${this.apiUrl}/${environment.api.devices.companies}`
    );
  }

  getDeviceTypes(): Observable<DeviceTypeInterface[]> {
    return this.http.get<DeviceTypeInterface[]>(
      `${this.apiUrl}/${environment.api.devices.types}`
    );
  }

  checkIMEIExists(imei: string): Observable<boolean> {
    const params = new HttpParams().set('imei', imei);
    return this.http
      .get<any>(`${this.apiUrl}/${environment.api.devices.emei_exist}`, {
        params,
      })
      .pipe(map((response) => response.exists));
  }

  getServerLists(): Observable<ServerInterface[]> {
    return this.http.get<ServerInterface[]>(
      `${this.apiUrl}/${environment.api.devices.servers}`
    );
  }

  createDevice(device: Device): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/${environment.api.devices.create}`, device)
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  updateDevice(device: Device): Observable<any> {
    return this.http
      .put<any>(
        `${this.apiUrl}/${environment.api.devices.update}${device.uid}/`,
        device
      )
      .pipe(
        map((response) => {
          // this.toastService.show('Device mise à jour avec succès', 'success');
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  deleteDevice(uid: string): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${environment.api.devices.delete}${uid}/`)
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleErrorDevice(error))
      );
  }

  getDeviceLocationByIMEI(
    imei: string
  ): Observable<DeviceLocationDataInterface> {
    return this.http
      .post<DeviceLocationDataInterface>(
        `${this.apiUrl}/${environment.api.devices.location}`,
        { device_imei: imei }
      )
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

    return throwError(() => new Error(message));
  }

  getTypeDevice(uid: string): Observable<DeviceType> {
    return this.http
      .get<DeviceType>(`${this.apiUrl}/${environment.api.devices.types}${uid}/`)
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  addDeviceAndZoneInformation(
    deviceZone: DeviceAndZoneInterface
  ): Observable<DeviceAndZoneInterface> {
    return this.http
      .post<DeviceAndZoneInterface>(
        `${this.apiUrl}/${environment.api.devices.create}`,
        deviceZone
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  getIntervetionZone(): Observable<IntervetionZoneList[]> {
    return this.http.get<IntervetionZoneList[]>(
      `${this.apiUrl}/${environment.api.devices.zone}`
    );
  }

  getListDevicesWithZone(): Observable<Device[]> {
    return this.http
      .get<Device[]>(`${this.apiUrl}/${environment.api.devices.list}`)
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  updateDeviceAndZoneInformation(
    deviceZone: DeviceAndZoneInterface,
    uid: string
  ): Observable<any> {
    return this.http
      .put<any>(
        `${this.apiUrl}/${environment.api.devices.update}${uid}/`,
        deviceZone
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  setDeviceData(data: Device) {
    this.deviceDataSubject.next(data);
  }

  getDeviceData(): Observable<Device | null> {
    return this.deviceDataSubject.asObservable();
  }

  setSaveDeviceInfo(isSave: boolean) {
    this.saveDeviceInfoSubject.next(isSave);
  }

  getSaveDeviceInfo(): Observable<boolean | null> {
    return this.saveDeviceInfoSubject.asObservable();
  }

  getCompaniesById(uid: string): Observable<CompanyInterface> {
    return this.http
      .get<CompanyInterface>(
        `${this.apiUrl}/${environment.api.devices.get_companies}${uid}/`
      )
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  getDevicesForAuthenticatedUser(): Observable<Device[]> {
    return this.http
      .get<Device[]>(
        `${this.apiUrl}/${environment.api.devices.get_devices_for_user}`
      )
      .pipe(
        map((response) =>  {
         return response
        }),
        catchError((error) => this.handleError(error))
      );
  }

  toggleEngineCommand(
    engineCommand: string,
    uid: string
  ): Observable<CommandeEngineImmobilizerResponse> {
    const payload = { command: engineCommand };
    return this.http
      .post<CommandeEngineImmobilizerResponse>(
        `${this.apiUrl}/${environment.api.devices.command}${uid}/`,
        payload
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleErrorCommand(error))
      );
  }

  speedLimiteCommand(
    speedLimit: DeviceCommand,
    uid: string
  ): Observable<DeviceCommand> {
    return this.http
      .post<DeviceCommand>(
        `${this.apiUrl}/${environment.api.devices.speed_limit}${uid}/`,
        speedLimit
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  getDeviceInfo(uid: string): Observable<CommandeInfoResponse> {
    const payload = { command: 'getinfo' };

    return this.http
      .post<any>(
        `${this.apiUrl}/${environment.api.devices.command}${uid}/`,
        payload
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleErrorCommand(error))
      );
  }

  getDeviceStatus(uid: string): Observable<CommandeStatusInfoResponse> {
    const payload = { command: 'getstatus' };

    return this.http
      .post<any>(
        `${this.apiUrl}/${environment.api.devices.command}${uid}/`,
        payload
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleErrorCommand(error))
      );
  }

  getDevicePosition(uid: string): Observable<CommandePositionInfoResponse> {
    const payload = { command: 'ggps' };

    return this.http
      .post<any>(
        `${this.apiUrl}/${environment.api.devices.command}${uid}/`,
        payload
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleErrorCommand(error))
      );
  }

  handleErrorCommand(error: HttpErrorResponse): Observable<never> {
    let message = 'Une erreur est survenue. Veuillez réessayer.';

    if (error.status === 401) {
      message = "Vous n'êtes pas autorisé à effectuer cette action.";
    } else if (
      error.status === 404 &&
      error.error?.message === 'Device not connected or timeout occurred'
    ) {
      message = "Le véhicule n'est pas connecté";
    } else if (error.status === 504) {
      message = "Le délai d'attente a expiré. Le véhicule n'a pas répondu.";
    } else if (error.status === 400) {
      message = "La requête a échoué. Les données attendues n'ont pas été reçues.";
    }

    return throwError(() => new Error(message));
  }

  getIntervetionZoneById(uid: string): Observable<IntervetionZoneList> {
    return this.http
      .get<IntervetionZoneList>(
        `${this.apiUrl}/${environment.api.devices.intervetion_zone}${uid}/`
      )
      .pipe(
        map((response) => response),
        catchError((error) => this.handleError(error))
      );
  }

  restoreDevice(uid: string): Observable<Device> {
    return this.http
      .delete<Device>(
        `${this.apiUrl}/${environment.api.devices.restore}${uid}/`
      )
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((error) => this.handleErrorDevice(error))
      );
  }

  private handleErrorDevice(error: any) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error && error.error.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
