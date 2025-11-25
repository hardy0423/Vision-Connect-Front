import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../user/services/user.service';
import { Notification } from '../../models/notification.models';
import { SharedModule } from '../../../../shared/shared.module';
import { MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { DeviceService } from '../../../device/services/device.service';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  ReplaySubject,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { Device } from '../../../device/models/device';
import { FormControl } from '@angular/forms';
import { getFrenchPaginatorIntl } from '../../../../data/utils/translate';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-notification-table',
  standalone: true,
  imports: [SharedModule, TranslateModule],
  templateUrl: './notification-table.component.html',
  styleUrl: './notification-table.component.scss',
  providers: [
    { provide: MatPaginatorIntl, useValue: getFrenchPaginatorIntl() },
  ],
})
export class NotificationTableComponent implements OnInit {
  public notifications: Notification[] = [];
  public filteredNotifications: Notification[] = [];
  public totalCount = 0;
  public selectedType: string = 'all';
  public selectedDate: Date | null = null;
  public deviceFilter: string = '';
  public limit = 10;
  public offset = 0;
  public deviceControl = new FormControl('');
  public filteredDevices!: Observable<Device[]>;
  public listDevice$?: Observable<Array<Device>>;
  public selectedDevice: string = '';
  public isAdminOrSuperUser: boolean = false;
  public isLoading = false;
  public idCompany: string | null = null;

  private readonly notificationsService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly deviceService = inject(DeviceService);
  private readonly translate = inject(TranslateService);
  private router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.userService.getUser().subscribe((user) => {
      if (user.is_superuser || user.is_admin) {
        this.isAdminOrSuperUser = true;
      }
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.idCompany = params.get('uid');

      this.selectedDevice = '';
      this.loadDevices();
      this.loadNotifications();

      if (this.idCompany) {
        this.deviceService.getCompaniesById(this.idCompany).subscribe({
          next: (device) => {
            if (!device) {
              this.router.navigate(['/not-found']);
            }
          },
          error: () => {
            this.router.navigate(['/not-found']);
          },
        });
      }
    });
  }

  private loadDevices(): void {
    if (this.idCompany) {
      this.listDevice$ = this.deviceService.getListDevices(this.idCompany).pipe(
        map((response) => {
          const devices = response.results;
          if (devices.length === 1) {
            this.selectedDevice = devices[0].name;
            this.applyFilters();
          } else if (devices.length === 0) {
            this.selectedDevice = '';
          }
          return devices;
        }),
        catchError(() => {
          this.selectedDevice = '';
          return of([]);
        })
      );
    } else {
      this.listDevice$ = of([]);
      this.selectedDevice = '';
    }
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications() {
    this.isLoading = true;
    this.notificationsService
      .getListNotifications(this.idCompany, this.limit, this.offset)
      .subscribe({
        next: (response) => {
          this.notifications = response.results;
          this.totalCount = response.count;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error fetching notifications:', error);
          this.notifications = [];
          this.filteredNotifications = [];
          this.totalCount = 0;
          this.isLoading = false;
        },
      });
  }

  onPageChange(event: PageEvent) {
    this.limit = event.pageSize;
    this.offset = event.pageIndex * event.pageSize;
    this.loadNotifications();
  }

  applyFilters() {
    this.filteredNotifications = this.notifications.filter((notification) => {
      if (
        this.selectedType !== 'all' &&
        notification.notification_type !== this.selectedType
      ) {
        return false;
      }

      if (this.selectedDate) {
        const notificationDate = new Date(
          notification.created_at
        ).toDateString();
        const selectedDateStr = this.selectedDate.toDateString();
        if (notificationDate !== selectedDateStr) {
          return false;
        }
      }

      if (this.selectedDevice) {
        const deviceName = this.extractDeviceName(
          notification.message
        ).toLowerCase();
        if (!deviceName.includes(this.selectedDevice.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
    this.changeDetectorRef.detectChanges();
  }

  resetFilters() {
    this.selectedType = 'all';
    this.selectedDate = null;
    this.deviceFilter = '';
    this.applyFilters();
  }

  extractDeviceName(message: string): string {
    const match = message.match(/\(Appareil: (.*)\)/);
    return match ? match[1] : 'Appareil inconnu';
  }

  markAsRead(uid: string) {
    this.notificationsService.markAsRead(uid).subscribe({
      next: () => {
        const notification = this.notifications.find((n) => n.uid === uid);
        if (notification) {
          notification.read = true;
        }
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      },
    });
  }
}
