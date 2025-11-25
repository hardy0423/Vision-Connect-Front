import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environment/environment';
import { Notification, NotificationResponse } from '../models/notification.models';
import { DateAdapter } from '@angular/material/core';
import { Stroke } from 'ol/style';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';

/**
 * NotificationService handles WebSocket communication for receiving and sending notifications.
 * It also provides methods to mark notifications as read and retrieve the list of notifications.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private socket: WebSocket | null = null;
  private notificationsList = new BehaviorSubject<Notification[]>([]);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 3000;
  private token: string | null = null;
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  constructor() {
    this.token = this.getValidToken();
    if (this.token) {
      this.connectWebSocket();
    }
  }

  private getValidToken(): string | null {
    const token = localStorage.getItem('accessToken');
    return token ? token : null;
  }

  /**
   * Establishes WebSocket connection to the server.
   * Reconnects automatically if the connection is closed.
   */
  private connectWebSocket(): void {
    if (!this.token) {
      console.warn('No valid token available for WebSocket connection');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const wsUrl = `${environment.wsUrl}/ws/notifications/?token=${this.token}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0; // Reset counter on successful connection
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          this.handleNewNotification(data.message);
        } else if (data.type === 'unread_notifications') {
          this.handleUnreadNotifications(data.notifications);
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (!(error instanceof ErrorEvent && error.message.includes('403'))) {
        this.handleReconnection();
      }
    };

    this.socket.onclose = (event) => {
      if (!event.wasClean) {
        this.handleReconnection();
      }
    };
  }

  private handleReconnection(): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      const delay =
        this.reconnectDelay * Math.min(5, Math.pow(2, this.reconnectAttempts));
      console.log(
        `Reconnecting attempt ${this.reconnectAttempts} in ${delay / 1000}s...`
      );
      setTimeout(() => this.connectWebSocket(), delay);
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }

  /**
   * Handles new notification messages and adds them to the notifications list.
   * @param notification - The new notification to be added.
   */
  private handleNewNotification(notification: Notification): void {
    const currentNotifications = this.notificationsList.value;
    this.notificationsList.next([notification, ...currentNotifications]); // Add new notification at the beginning
  }

  /**
   * Handles the list of unread notifications and updates the notifications list.
   * @param notifications - The list of unread notifications to set.
   */
  private handleUnreadNotifications(notifications: Notification[]): void {
    this.notificationsList.next(notifications);
  }

  /**
   * Returns the observable list of notifications.
   * @returns An observable stream of the notifications list.
   */
  getNotifications(): Observable<Notification[]> {
    return this.notificationsList.asObservable();
  }

  /**
   * Marks a notification as read and updates the notifications list.
   * @param notificationId - The unique ID of the notification to be marked as read.
   * @returns An observable that completes after marking the notification as read.
   */
  markAsRead(notificationId: string): Observable<void> {
    return new Observable<void>((observer) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        // Send a WebSocket message to mark the notification as read
        this.socket.send(
          JSON.stringify({
            type: 'mark_read',
            notification_id: notificationId,
          })
        );

        // Update the local notifications list
        const currentNotifications = this.notificationsList.value;
        const updatedNotifications = currentNotifications.map((n) =>
          n.uid === notificationId ? { ...n, read: true } : n
        );

        // Filter unread notifications and update the list
        const unreadNotifications = updatedNotifications.filter(
          (notification) => !notification.read
        );
        this.notificationsList.next(unreadNotifications);

        observer.next(); // Notify observer that the operation was successful
        observer.complete();
      } else {
        observer.error('WebSocket is not open');
      }
    });
  }

  getListNotifications(idCompany: string | null, limit: number = 10, offset: number = 0): Observable<NotificationResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());
  
    return this.http.get<NotificationResponse>(
      `${this.apiUrl}/${environment.api.companies.list_notification}${idCompany}`,
      { params }
    );
  }
  
}
