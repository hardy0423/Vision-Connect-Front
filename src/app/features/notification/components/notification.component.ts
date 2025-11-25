import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Notification } from '../models/notification.models';
import { NotificationService } from '../services/notification.service';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Subject, switchMap, takeUntil, tap } from 'rxjs';

/**
 * NotificationComponent handles the display of notifications.
 * It interacts with the NotificationService to retrieve, mark as read,
 * and display notifications, while also notifying the parent component
 * when a notification is marked as read.
 */
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit, OnDestroy {
  public notificationsList: Notification[] = [];
  public notificationItem?: Notification;
  private destroy$ = new Subject<void>();

  @Output() markAsReadNotification = new EventEmitter<boolean>();


  constructor(private notificationsService: NotificationService) {}

  ngOnInit() {
    this.notificationsService
      .getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notifications) => {
          // Filter and process valid notifications
          const validNotifications = notifications.filter(
            (notification) => notification.notification_type
          );

          validNotifications.forEach((notification) => {
            const exists = this.notificationsList.some(
              (existingNotification) =>
                existingNotification.uid === notification.uid
            );

            // If the notification doesn't already exist, add it to the list
            if (!exists) {
              notification.class = this.getSeverityClass(
                notification.notification_type
              ); // Set severity class
              this.notificationsList.push(notification);
            }
          });
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
        },
      });
  }

  /**
   * Marks a notification as read and removes it from the notification list.
   * @param notification The notification to be marked as read.
   */
  markAsRead(notification: Notification) {
    this.notificationItem = notification;
    this.notificationsService.markAsRead(notification.uid).subscribe({
      next: () => {
        // Remove the notification from the list after marking it as read
        this.notificationsList = this.notificationsList.filter(
          (existingNotification) =>
            existingNotification.uid !== notification.uid
        );
        // Emit event to notify parent component that the notification was read
        this.markAsReadNotification.emit(true);
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      },
    });
  }

  /**
   * Determines the severity class for a given notification type.
   * @param type The type of the notification (e.g., 'alert', 'warning').
   * @returns A CSS class for styling the notification.
   */
  getSeverityClass(type: string | undefined): string {
    switch (type) {
      case 'Critique':
        return 'bg-primary text-white border-primary';
      case 'Élevé':
        return 'bg-orange-500 text-white border-orange-500';
      case 'Moyen':
        return 'bg-yellow-500 text-white border-yellow-500';
      case 'Faible':
        return 'bg-custom-gray text-white border-custom-gray';
      default:
        return 'bg-gray-100 text-black border-gray-400';
    }
  }

  /**
   * Cleanup when the component is destroyed to avoid memory leaks.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
