import { Injectable, OnDestroy } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Observable, Subject, timer } from 'rxjs';
import { environment } from '../../../../environment/environment';
import { DeviceStatus } from '../models/device';
import { catchError, repeat, takeUntil, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DeviceStatusService implements OnDestroy {
    private _websocketUrl = `${environment.wsUrl}/ws/device-status/`;
    private _socket$?: WebSocketSubject<DeviceStatus>;
    private _statusUpdates$: Subject<DeviceStatus> = new Subject<DeviceStatus>();
    private _reconnectAttempts = 0;
    private _maxReconnectAttempts = 5;
    private _reconnectInterval = 5000;
    private _stop$ = new Subject<void>();
  
    constructor() {
      this._initializeWebSocketConnection();
    }
  
    private _initializeWebSocketConnection(): void {
      this._socket$ = webSocket<DeviceStatus>(this._websocketUrl);
  
      this._socket$
        .pipe(
          takeUntil(this._stop$),
          catchError((error) => {
            if (this._reconnectAttempts < this._maxReconnectAttempts) {
              this._reconnectAttempts++;
              return timer(this._reconnectInterval).pipe(repeat(1));
            } else {
              throw new Error('Max reconnection attempts reached');
            }
          }),
          tap(() => {
            this._reconnectAttempts = 0;
          })
        )
        .subscribe({
          next: (data: any) => {
            this._statusUpdates$.next(data);
          },
          error: (error) => {
            console.error('WebSocket subscription error:', error);
          },
          complete: () => {
            console.warn('WebSocket connection closed');
          },
        });
    }
  
    getStatusUpdates(): Observable<DeviceStatus> {
      return this._statusUpdates$.asObservable();
    }
  
    ngOnDestroy(): void {
      this._stop$.next();
      this._stop$.complete();
      if (this._socket$) {
        this._socket$.complete();
      }
    }
}
