/**
 * Component that displays and manages a table of devices.
 * It supports filtering, pagination, selection, and CRUD actions.
 */

import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent,
} from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { SelectionModel } from '@angular/cdk/collections';
import { ActivatedRoute } from '@angular/router';
import {
  catchError,
  EMPTY,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';
import { ColDef } from 'ag-grid-community';

import { DeviceService } from '../../services/device.service';
import { ModalService } from '../../services/modal.service';
import { DeviceStatusService } from '../../services/status.service';
import { CompanyService } from '../../../company/services/company.service';
import { ToastService } from 'angular-toastify';

import { Device, DeviceResponse, DeviceStatus } from '../../models/device';
import { CompanyInterface } from '../../../../data/interfaces/company.interface';
import { DeviceTypeInterface } from '../../../../data/interfaces/device-type.interface';
import { IntervetionZoneList } from '../../../map/models/zone';

import { TranslateService } from '@ngx-translate/core';
import { ConfirmationComponent } from '../../../../shared/confirmation/confirmation.component';
import { getFrenchPaginatorIntl } from '../../../../data/utils/translate';
import { SharedModule } from '../../../../shared/shared.module';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-device',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    CommonModule,
    SharedModule,
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: getFrenchPaginatorIntl() },
  ],
  templateUrl: './table-device.component.html',
  styleUrls: ['./table-device.component.scss'],
})
export class TableDeviceComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  // ========== ViewChild References ==========
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ========== Inputs & Outputs ==========
  @Input() rowData: Device[] | null = [];
  @Output() rowsSelected = new EventEmitter<Device[]>();
  @Output() dataChanged = new EventEmitter<boolean>();
  @Output() totalCompany = new EventEmitter<number>();

  // ========== Table Configuration ==========
  public displayedColumns: string[] = [
    'type',
    'status',
    'name',
    'car_name',
    'imei',
    'sim_number',
    'intervention_zone',
    'actions',
  ];
  public dataSource = new MatTableDataSource<Device>([]);
  public selection = new SelectionModel<Device>(true, []);
  public themeClass = 'ag-theme-material';
  public rowSelection: 'single' | 'multiple' = 'multiple';
  public defaultColDef: ColDef = {
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    editable: false,
  };

  // ========== Filter & Pagination ==========
  public filterActiveDevice = true;
  public filterInactiveDevice = false;
  public currentStatusFilter: string | null = null;
  public pageSize = 10;
  public pageIndex = 0;
  public isLoading = true;
  public deviceStatus: string | null = 'active';

  // ========== State Flags ==========
  public hideMessageInfo = false;
  public deviceOnAndOff = ['On', 'Off'];

  // ========== Stats ==========
  public totalDevices = 0;
  public totalUsed = 0;
  public companyDeviceLimit = 0;

  // ========== Lists ==========
  public companies: CompanyInterface[] = [];
  public deviceTypes: DeviceTypeInterface[] = [];
  public deviceListStatus: DeviceStatus[] = [];
  public listDevice: Device[] = [];
  public listInterventionZone: IntervetionZoneList[] = [];

  // ========== Device Config ==========
  public idDevice: string | null = null;
  public deviceDataStatus?: DeviceStatus;

  // ========== Subscriptions ==========
  private deviceDataSubscription?: Subscription;
  private statusSubscription?: Subscription;
  private readonly destroy$ = new Subject<void>();

  // ========== Injected Services ==========
  private readonly route = inject(ActivatedRoute);
  private readonly deviceService = inject(DeviceService);
  private readonly deviceStatusService = inject(DeviceStatusService);
  private readonly modalService = inject(ModalService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(MatDialog);
  private readonly toastService = inject(ToastService);

  /** Initialize device list and listen to route param changes */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        tap((params) => (this.idDevice = params.get('uid'))),
        switchMap(() =>
          this.deviceService.getListDevicesFilter(
            this.idDevice!,
            this.filterActiveDevice
              ? 'true'
              : this.filterInactiveDevice
              ? 'false'
              : undefined,
            this.pageIndex,
            this.pageSize
          )
        )
      )
      .subscribe({
        next: (listDevice: DeviceResponse) => {
          this.isLoading = false;
          this.dataSource.data = listDevice.results;
          this.emitSelectionChanges();
          this.totalUsed = listDevice.results.length;
          this.companyDeviceLimit =
            listDevice.results[0]?.company_manager?.nbr_device ?? 0;
          this.hideMessageInfo = this.companyDeviceLimit === 0;
        },
        error: () => {
          this.isLoading = false;
        },
      });

    this.deviceStatusService
      .getStatusUpdates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.deviceDataStatus = data;
        },
        error: (error) =>
          console.error('Error receiving device status:', error),
      });
  }

  /** Attach paginator and sorter to the table */
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /** Handle input changes (device list refresh) */
  ngOnChanges(changes: SimpleChanges): void {
    this.deviceDataSubscription = this.deviceService
      .getSaveDeviceInfo()
      .pipe(take(2))
      .subscribe((isSaved: boolean | null) => {
        if (isSaved) {
          this.dataChanged.emit(true);
          this.applyDeviceStatusFilter();
          this.deviceService.setSaveDeviceInfo(false);
        }
      });
  }

  /** Cleanup on destroy */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.deviceDataSubscription?.unsubscribe();
  }

  /** Return company name by UID */
  getCompanyNameByUID(company: any): string {
    return this.companies.find((c) => c.uid === company.uid)?.name ?? '';
  }

  /** Filter device list by active/inactive state */
  applyDeviceStatusFilter(): void {
    this.isLoading = true;
    const active = this.deviceStatus === 'active' ? 'true' : 'false';
    // const active =
    //   this.filterActiveDevice && !this.filterInactiveDevice
    //     ? 'true'
    //     : !this.filterActiveDevice && this.filterInactiveDevice
    //     ? 'false'
    //     : undefined;


    this.deviceService
      .getListDevicesFilter(
        this.idDevice!,
        active,
        this.pageIndex,
        this.pageSize
      )
      .subscribe({
        next: (listDevice: DeviceResponse) => {
          this.dataSource.data = listDevice.results;
          this.emitSelectionChanges();
          this.isLoading = false;
          this.totalUsed = listDevice.results.length;
          this.companyDeviceLimit =
            listDevice.results[0]?.company_manager?.nbr_device ?? 0;
          this.hideMessageInfo = this.companyDeviceLimit === 0;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error while filtering devices', error);
        },
      });
  }

  /** Emit selected devices */
  private emitSelectionChanges(): void {
    this.rowsSelected.emit(this.selection.selected);
  }

  /** Open modal for create or edit device */
  openModal(isAdd: boolean, device: Device): void {
    this.modalService.openModal(isAdd, device, this.idDevice);
  }

  /** Open modal for sending commands */
  openCommandModal(device: Device): void {
    this.modalService.openCommandModal(device);
  }

  /** Restore a deleted/inactive device */
  restoreDevice(device: Device): void {
    const data = {
      title: this.translate.instant('device.title_activation'),
      content: this.translate.instant('device.activate_device'),
      yes: this.translate.instant('device.confirmation'),
      no: this.translate.instant('device.refus'),
    };

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      autoFocus: true,
      data,
    });

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((result) =>
          result
            ? this.deviceService.restoreDevice(device.uid!).pipe(
                catchError((error) => {
                  this.toastService.error(
                    error?.message ||
                      this.translate.instant('device.error.restore_device')
                  );
                  return EMPTY;
                }),
                tap(() => {
                  this.dataChanged.emit(true);
                  this.deviceService.setSaveDeviceInfo(false);
                  this.applyDeviceStatusFilter();
                  this.toastService.success(
                    this.translate.instant('device.success_restore_device')
                  );
                })
              )
            : EMPTY
        )
      )
      .subscribe();
  }

  /** Open modal to delete (deactivate) device */
  openDeleteModal(device: Device): void {
    const data = {
      title: this.translate.instant('device.title_inactif'),
      content: this.translate.instant('device.inactif_content'),
      yes: this.translate.instant('device.confirmation'),
      no: this.translate.instant('device.refus'),
    };

    const dialogRefDelete = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      autoFocus: true,
      data,
    });

    dialogRefDelete
      .afterClosed()
      .pipe(
        switchMap((result) =>
          result
            ? this.deviceService.deleteDevice(device.uid!).pipe(
                catchError((error) => {
                  this.toastService.error(
                    error?.message ||
                      this.translate.instant('device.error.delete_device')
                  );
                  return EMPTY;
                }),
                tap(() => {
                  this.dataChanged.emit(true);
                  this.deviceService.setSaveDeviceInfo(false);
                  this.applyDeviceStatusFilter();
                  this.toastService.success(
                    this.translate.instant('device.success_delete_device')
                  );
                })
              )
            : EMPTY
        )
      )
      .subscribe();
  }

  /** Filter table by column value */
  applyFilter(event: Event, column: string): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();

    this.dataSource.filterPredicate = (data: Device, filter: string) => {
      const [columnFilter, searchText] = filter.split('::');
      if (!searchText) return true;

      try {
        switch (columnFilter) {
          case 'type':
            return data.type?.name?.toLowerCase().includes(searchText) ?? false;
          case 'name':
            return data.name?.toLowerCase().includes(searchText) ?? false;
          case 'imei':
            return data.imei?.toLowerCase().includes(searchText) ?? false;
          case 'sim_number':
            return data.sim_number?.toLowerCase().includes(searchText) ?? false;
          case 'intervention_zone':
            return (
              data.zone?.nameZone?.toLowerCase().includes(searchText) ?? false
            );
          default:
            return true;
        }
      } catch {
        return true;
      }
    };

    this.dataSource.filter = `${column}::${filterValue}`;
  }

  /** Filter table by device status */
  applyDeviceFilterStatus(event: MatSelectChange): void {
    this.currentStatusFilter = event.value || null;

    this.dataSource.filterPredicate = (data: Device) => {
      if (!this.currentStatusFilter) return true;
      const status = (data.mode_status || data.status || '')
        .toString()
        .toLowerCase();
      return status === this.currentStatusFilter.toLowerCase();
    };

    this.dataSource.filter = JSON.stringify({
      status: this.currentStatusFilter,
    });

    this.dataSource.paginator?.firstPage();
  }

  /** Handle paginator page change */
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.applyDeviceStatusFilter();
  }

  /** Hide info message */
  hideMessage(): void {
    this.hideMessageInfo = true;
  }
}
