// **Angular Core**
import {
  ChangeDetectorRef,
  Component,
  inject,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
// **Angular Forms**
import { FormControl, FormGroup, Validators } from '@angular/forms';

// **Angular Material**
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
// **Third-party Libraries**
import { TranslateService } from '@ngx-translate/core';

// **RxJS**
import {
  catchError,
  EMPTY,
  Observable,
  ReplaySubject,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

// **Services**
import { DeviceService } from '../../services/device.service';
import { MapService } from '../../../map/services/map.service';

// **Interfaces**
import { Coordinates } from '../../../../data/interfaces/map.interface';
import { IntervetionZoneList, ZoneData } from '../../../map/models/zone';
import { Device, DeviceAndZoneInterface } from '../../models/device';

// **Validators**
import { imeiValidator } from '../../../../data/utils/validator-utils';

// **Shared Components**
import {
  MyErrorStateMatcher,
  MyErrorStateMatcherSelectZone,
} from '../../../../shared/error/error.component';
import { ButtonComponent } from '../../../../shared/atoms/button/button/button.component';
import { SharedModule } from '../../../../shared/shared.module';

// **Local Components**
import { PositionMapComponent } from '../../../map/components/position/position-map.component';
import { ZoneMapComponent } from '../../../map/components/draw-zone/draw-zone.component';
import { AddDeviceComponent } from '../../../modal/device-form-fields/device-form.component';
import { RevisionComponent } from '../../../revision/revision.component';

// **Other Libraries**
import { Map } from 'ol';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from 'angular-toastify';
import { boundingExtent, getCenter } from 'ol/extent';

@Component({
  selector: 'app-form-device',
  standalone: true,
  imports: [
    SharedModule,
    PositionMapComponent,
    ZoneMapComponent,
    AddDeviceComponent,
  ],
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.scss'],
})
export class FormDeviceComponent implements OnInit, OnDestroy {
  // ========= Observables & Subscriptions =========
  public listInterventionZone$!: Observable<IntervetionZoneList[]>;
  private deviceDataSubscription?: Subscription;
  private readonly destroy$ = new Subject<void>();
  public destroyed$ = new ReplaySubject<boolean>(1);

  // ========= Booleans (UI states) =========
  public drawInterventionZone = false;
  public showInfoNameZone = false;
  public emptyNameZone = false;
  public isButtonDisabled = true;
  public updateDevice = false;

  // ========= Identifiers =========
  public idCompany: string | null = null;
  public intervetionZone!: string;
  public intervetionZoneId!: string;
  public deviceId!: string;

  // ========= Form Controls =========
  public namezoneFormControl = new FormControl('', [Validators.required]);
  public selectedInterventionZone = new FormControl('');
  public selectFormControl = new FormControl('valid', [
    Validators.required,
    Validators.pattern('valid'),
  ]);
  public nativeSelectFormControl = new FormControl('valid', [
    Validators.required,
    Validators.pattern('valid'),
  ]);
  public deviceFormGroup!: FormGroup;

  // ========= Form Error Matchers =========
  public matcher = new MyErrorStateMatcher(this.emptyNameZone);
  public matcherSelect = new MyErrorStateMatcherSelectZone();

  // ========= Maps & Coordinates =========
  public receivedMap: Map | null = null;
  public markerCoords!: Coordinates;

  // ========= Device & Zone Data =========
  public feature: any; // À typer précisément si possible
  public deviceZoneInformation?: IntervetionZoneList;
  public deviceData: Device | null = null;

  // ========= Méthodes de callback / hook =========
  public saveDeviceAndZoneData!: () => void;
  public onInitInstance!: () => void;

  // ========= Services =========
  private readonly mapService = inject(MapService);
  private readonly deviceService = inject(DeviceService);
  private readonly _toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

  constructor(
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<FormDeviceComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      device: { zone: IntervetionZoneList; uid: string };
      isAdd: boolean;
      idCompany: string;
    }
  ) {
    this.idCompany = data.idCompany;
    if (!data.isAdd) {
      this.deviceZoneInformation = data.device.zone;
      this.deviceId = data.device.uid;
    }
    const onAddDeviceAndZone: Subject<void> = new Subject<void>();
    this.saveDeviceAndZoneData = () => {
      onAddDeviceAndZone.next();
    };

    onAddDeviceAndZone
      .pipe(
        takeUntil(this.destroyed$),
        switchMap(() => {
          let data: DeviceAndZoneInterface = {
            device: {
              ...this.deviceFormGroup.value,
              company_manager: this.data.idCompany,
            },
            zone: {
              zoneId: this.selectedInterventionZone.value || undefined,
              ...(this.selectedInterventionZone.value
                ? {}
                : {
                    ...this.feature,
                    properties: {
                      ...this.feature.properties,
                      nameZone: this.namezoneFormControl.value,
                    },
                  }),
            },
          };

          if (this.deviceId) {
            return this.deviceService
              .updateDeviceAndZoneInformation(data, this.deviceId)
              .pipe(
                catchError((error) => {
                  if (error.status == 400) {
                    this._toastService.error(
                      this.translate.instant(
                        'device.error.error_updating_device'
                      )
                    );
                  }
                  return EMPTY;
                }),
                tap(() => {
                  this.deviceService.setSaveDeviceInfo(true);
                  this.dialogRef.close();
                  this._toastService.success(
                    this.translate.instant('device.success_updating_device')
                  );
                })
              );
          } else {
            return this.deviceService.addDeviceAndZoneInformation(data).pipe(
              catchError((error) => {
                if (error.status == 400) {
                  this._toastService.error(
                    this.translate.instant('device.error.error_creating_device')
                  );
                }
                return EMPTY;
              }),
              tap(() => {
                this.deviceService.setSaveDeviceInfo(true);
                this.dialogRef.close();
                this._toastService.success(
                  this.translate.instant('device.success_creating_device')
                );
              })
            );
          }

          return EMPTY;
        })
      )
      .subscribe();

    this.onInitInstance = () => {
      onInit.next();
    };

    const onInit: ReplaySubject<void> = new ReplaySubject<void>(1);
    this.selectedInterventionZone.valueChanges.subscribe(
      (selectedId: string | null) => {
        this.updateButtonState();
        if (selectedId) {
          this.getViewInterventionZone(selectedId);
          this.intervetionZoneId = selectedId;
        }
      }
    );

    this.listInterventionZone$ = onInit.pipe(
      switchMap(() => {
        return this.mapService.getAllInterventionZone(this.idCompany).pipe(
          catchError(() => {
            return EMPTY;
          }),
          tap(() => {})
        );
      })
    );
  }

  ngOnInit(): void {
    this.onInitInstance();
    if (this.deviceZoneInformation) {
      this.selectedInterventionZone.setValue(this.deviceZoneInformation.uid);
    }

    this.namezoneFormControl.valueChanges.subscribe((value) => {
      this.updateButtonState();
      if (value) {
        this.emptyNameZone = false;
        this.showInfoNameZone = !value;
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyed$.next(true);
    this.destroyed$.complete();
    this.deviceDataSubscription?.unsubscribe();
  }

  onDrawZone(isDrawing: boolean) {
    if (isDrawing) {
      this.drawInterventionZone = true;
      this.showInfoNameZone = true;
    } else {
      this.drawInterventionZone = false;
      this.showInfoNameZone = false;
    }
  }

  emptyNameInterventionZone(isEmpty: boolean) {
    this.emptyNameZone = isEmpty;
    this.matcher = new MyErrorStateMatcher(this.emptyNameZone);
    this.cdr.markForCheck();
  }

  saveZoneEvent(isSaving: boolean): void {
    if (isSaving) {
      this.listInterventionZone$ = this.mapService
        .getAllInterventionZone(this.idCompany)
        .pipe(
          catchError(() => {
            this._toastService.error(
              this.translate.instant('map.error.error_get_zone_liste')
            );
            return EMPTY;
          }),
          tap(() => {})
        );
    }
  }

  deleteZoneEvent(isDeleting: boolean): void {}

  setDeviceFormGroup(formGroup: FormGroup): void {
    this.deviceFormGroup = formGroup;
    this.cdr.detectChanges();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  setMarkerCoordsChange(coordonnees: Coordinates) {
    this.markerCoords = coordonnees;
  }

  onMapReceived(map: Map) {
    this.receivedMap = map;
  }

  saveMapData(): void {
    if (this.receivedMap) {
      const mapData: Map = this.receivedMap;
      this.mapService.setMapData(mapData);
    }
  }

  handleFeatureChange(featureData: any) {
    this.feature = featureData;
  }

  onDeselectZone(isDeselect: boolean) {
    if (isDeselect) {
      this.selectedInterventionZone.setValue(null);
      this.intervetionZoneId = '';
    }
  }

  private updateButtonState() {
    this.isButtonDisabled = !(
      this.selectedInterventionZone.value ||
      (this.drawInterventionZone && !this.namezoneFormControl.invalid)
    );
  }

  getViewInterventionZone(interventionZoneValueSelected: string): void {
    this.deviceService
      .getIntervetionZoneById(interventionZoneValueSelected)
      .pipe(
        catchError((error) => {
          console.error('Error fetching intervention zone details:', error);
          return EMPTY;
        })
      )
      .subscribe({
        next: (data) => {
          this.zoomToInterventionZone(data);
        },
      });
  }

  zoomToInterventionZone(zone: any) {
    if (!zone || !zone.geom || zone.geom.type !== 'Polygon') {
      return;
    }
    const coordinates = zone.geom.coordinates[0];
    const extent = boundingExtent(coordinates);
    const center = getCenter(extent);
    this.receivedMap?.getView().animate({
      center: center,
      zoom: 7,
      duration: 1000,
    });
  }
}
