import { Component, Inject, inject, model, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../../../shared/shared.module';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MyErrorStateMatcherSelectZone } from '../../../../shared/error/error.component';
import {
  catchError,
  EMPTY,
  map,
  Observable,
  of,
  ReplaySubject,
  switchMap,
  tap,
} from 'rxjs';
import { DeviceService } from '../../../device/services/device.service';
import { TranslateService } from '@ngx-translate/core';
import { Device } from '../../../device/models/device';
import { ModalData } from '../../models/rapport.model';

@Component({
  selector: 'app-rapport-table',
  standalone: true,
  imports: [SharedModule],
  providers: [],
  templateUrl: './trajectory.component.html',
  styleUrl: './trajectory.component.scss',
})
export class RapportTableComponent implements OnInit {
  // ========== Injected Services ==========
  private readonly fb = inject(FormBuilder);
  private readonly deviceService = inject(DeviceService);

  // ========== Form & Validation ==========
  public reportFormGroup?: FormGroup;
  public matcher = new MyErrorStateMatcherSelectZone();

  // ========== Observables ==========
  public listDevice$!: Observable<Device[]>;

  // ========== Data & State ==========
  public selectedDate: Date | null = null;
  public today: Date = new Date();
  public idCompany: string | null = null;
  public inteventionZoneId?: string;
  public reportData?: ModalData;
  public deviceData?: Device;

  public checked = false;
  public disabled = false;

  // ========== Methods ==========
  public onInitInstance!: () => void;
  constructor(
    public dialogRef: MatDialogRef<RapportTableComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      idCompany: string;
      device: string;
      date: string;
      showZone: boolean;
      zoneId: string;
    }
  ) {
    this.idCompany = data.idCompany;
    this.reportData = data;
    this.onInitInstance = () => {
      onInit.next();
    };
    const onInit: ReplaySubject<void> = new ReplaySubject<void>(1);
    this.listDevice$ = onInit.pipe(
      switchMap(() => {
        if (this.idCompany) {
          return this.deviceService.getListDevices(this.idCompany).pipe(
            map((response) => response.results),
            catchError(() => {
              return of([]);
            }),
            tap((listDevice) => {
              if (listDevice.length === 1) {
                this.reportFormGroup?.patchValue({
                  selectedDevice: listDevice[0].uid,
                });
              }
            })
          );
        }
        return of([]); // Retourne un tableau vide si `idCompany` est null
      })
    );
  }

  ngOnInit(): void {
    this.onInitInstance();
    this.reportFormGroup = this.fb.group({
      selectedDevice: ['', [Validators.required]],
    });

    this.reportFormGroup.patchValue({
      selectedDevice: this.reportData?.device || null,
    });

    this.checked = this.reportData!.showZone;

    this.selectedDate = this.reportData?.date
      ? new Date(this.reportData!.date)
      : new Date();
  }

  reportDetail(): void {
    const selectedDevice = this.reportFormGroup?.get('selectedDevice')?.value;
    const selectedDate = this.selectedDate
      ? this.formatDateToLocalISOString(this.selectedDate)
      : null;
    if (selectedDevice) {
      this.deviceService.getDeviceByUid(selectedDevice).subscribe({
        next: (deviceToEdit) => {
          this.deviceData = deviceToEdit;
          this.inteventionZoneId = this.deviceData.zone?.uid;
          const result = {
            device: selectedDevice,
            date: selectedDate,
            showZone: this.checked,
            zoneId: this.inteventionZoneId,
          };
          this.dialogRef.close(result);
        },
        error: (error) =>
          console.error('Erreur lors de la récupération du dispositif', error),
      });
    } else {
      const result = {
        device: selectedDevice,
        date: selectedDate,
        showZone: this.checked,
        zoneId: this.inteventionZoneId,
      };
      this.dialogRef.close(result);
    }
  }

  disableFutureDates = (date: Date): boolean => {
    return date <= this.today;
  };

  closeModal(): void {
    this.dialogRef.close();
  }

  formatDateToLocalISOString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onToggleChange(event: any): void {
    this.checked = event.checked;
  }
}
