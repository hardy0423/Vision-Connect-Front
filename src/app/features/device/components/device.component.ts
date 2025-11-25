import {
  Component,
  inject,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  forkJoin,
  map,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatDialog } from '@angular/material/dialog';
import { DeviceService } from '../services/device.service';
import { TableDeviceComponent } from './tabledevice/table-device.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ModalService } from '../services/modal.service';
import { Device } from '../models/device';
import { SharedModule } from '../../../shared/shared.module';
import { UserService } from '../../user/services/user.service';
import { ConfirmationComponent } from '../../../shared/confirmation/confirmation.component';
import { ActivatedRoute, Router } from '@angular/router';
import { UserInterface } from '../../../data/interfaces/user.interface';
import { CompanyService } from '../../company/services/company.service';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    CommonModule,
    TableDeviceComponent,
    NgbModule,
    TranslateModule,
    SharedModule,
  ],
  templateUrl: `./device.component.html`,
  styleUrls: ['./device.component.scss'],
})
export class DeviceComponent implements OnInit, OnChanges {
  // ========== Injected Services ==========
  private readonly userService = inject(UserService);
  private readonly deviceService = inject(DeviceService);
  private readonly route = inject(ActivatedRoute);
  private readonly companyService = inject(CompanyService);
  private router = inject(Router);

  // ========== Device-related Properties ==========
  public rowData: Device[] = [];
  public selectedRows: Device[] = [];
  public device?: Device;

  // ========== User-related Properties ==========
  public userInformation!: UserInterface;
  public isAdminOrSuperUser: boolean = false;
  public idDevice: string | null = null;

  // ========== Permissions ==========
  public canAddDevice?: boolean;
  public isDeviceAssigned: boolean = false;

  // ========== Statistics ==========
  public totalVehicles: number = 0;
  public totalCompanies: number = 0;
  public totalKilometers: number = 0;
  public kilometersToday: number = 0;
  public companyName: string = '';

  // ========== State & Observables ==========
  private readonly reloadDevices$ = new BehaviorSubject<void>(undefined);
  public isLoadDevice: boolean = true;
  private readonly destroy$ = new Subject<void>();

  constructor(
    public dialog: MatDialog,
    public translate: TranslateService,
    private modalService: ModalService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    throw new Error('Method not implemented.');
  }

  handleRowsSelected(selectedDevices: Device[]): void {
    this.selectedRows = selectedDevices;
  }

  handleTotalCompany(numberCompany: number): void {
    this.totalCompanies = numberCompany;
  }

  openModal(isAdd: boolean = true, deviceData: Device, idDevice: string): void {
    this.modalService.openModal(isAdd, deviceData, idDevice);
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.idDevice = params.get('uid');
      if (!this.idDevice) {
        this.router.navigate(['/not-found']);
        return;
      }

      this.deviceService
        .getCompaniesById(this.idDevice)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (company) => {
            console.log("DEVICE ", company);
            this.companyName = company.name
            
            if (!company) {
              this.router.navigate(['/not-found']);
            }
          },
          error: () => {
            this.router.navigate(['/not-found']);
          },
        });

      this.loadCompanies(this.idDevice);
      this.reloadDevices$.next();
    });

    this.userService
      .getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.isAdminOrSuperUser = user.is_superuser || user.is_admin;
      });

    this.reloadDevices$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadDevices();
    });
  }

  ngAfterViewInit(): void {}

  deleteSelectedRows(): void {
    if (this.selectedRows.length > 0) {
      let data = {
        title: this.translate.instant('device.title_inactif'),
        content: this.translate.instant('device.inactif_content'),
        yes: this.translate.instant('device.confirmation'),
        no: this.translate.instant('device.refus'),
      };

      const dialogRef = this.dialog.open(ConfirmationComponent, {
        disableClose: true,
        autoFocus: true,
        data: data,
      });

      dialogRef
        .afterClosed()
        .pipe(
          switchMap((result) => {
            if (result === true) {
              const deleteObservables = this.selectedRows
                .map((device) => {
                  if (device.isNew) {
                    this.rowData = this.rowData.filter(
                      (d) => d.uid !== device.uid
                    );
                    return null;
                  } else {
                    return this.deviceService.deleteDevice(device.uid!).pipe(
                      map(() => {
                        this.rowData = this.rowData.filter(
                          (d) => d.uid !== device.uid
                        );
                      }),
                      catchError((error) => {
                        this.deviceService.handleError(error);
                        return throwError(() => error);
                      })
                    );
                  }
                })
                .filter((obs) => obs !== null);

              if (deleteObservables.length > 0) {
                return forkJoin(deleteObservables).pipe(
                  tap(() => {
                    this.loadDevices();
                  })
                );
              } else {
                return EMPTY;
              }
            } else {
              return EMPTY;
            }
          })
        )
        .subscribe();
    }
  }

  loadDevices(): void {
    this.isLoadDevice = false;

    this.deviceService.getListDevicesFilter(this.idDevice!).subscribe({
      next: (data) => {
        this.isLoadDevice = true;
        if (data.results.length > 0) {
          this.canAddDevice = data.results[0].is_device_addable;
        } else {
          this.canAddDevice = true;
        }
        this.rowData = data.results;
      },
      error: (error) => {
        this.isLoadDevice = true;
        console.error('Error loading devices:', error);
      },
    });
  }

  loadCompanies(DeviceId: string): void {
    this.companyService.getCompanyById(DeviceId).subscribe({
      next: (data) => {
        if (data.nbr_device && data.nbr_device > 0) {
          this.isDeviceAssigned = true;
        }
      },
      error: (error) => {
        console.error('Error loading company data:', error);
      },
    });
  }
  saveNewDevice(isNew: boolean) {
    if (isNew) {
      this.reloadDevices$.next();
    }
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
