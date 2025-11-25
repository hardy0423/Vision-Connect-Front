import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Inject,
  Output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeviceTypeInterface } from '../../../data/interfaces/device-type.interface';
import { CompanyInterface } from '../../../data/interfaces/company.interface';
import { ServerInterface } from '../../../data/interfaces/server.interface';
import { debounceTime, Subject } from 'rxjs';
import { DeviceService } from '../../device/services/device.service';
import { FormDeviceComponent } from '../../device/components/add-device/add-device.component';
import { TranslateService } from '@ngx-translate/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { imeiValidator } from '../../../data/utils/validator-utils';
import { DeviceLocationDataInterface } from '../../../data/interfaces/device-location-data.interface';
import { Coordinates } from '../../../data/interfaces/map.interface';
import { PhoneTextLabels } from '../../../data/interfaces/phone.interface';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';
import { Device } from '../../device/models/device';
import { SharedModule } from '../../../shared/shared.module';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

@Component({
  selector: 'app-add-device',
  standalone: true,
  imports: [SharedModule, NgxMaterialIntlTelInputComponent],
  templateUrl: './device-form.component.html',
  styleUrl: './device-form.component.scss',
})
export class AddDeviceComponent {
  // Form-related variables
  protected deviceFormGroup!: FormGroup;
  private formBuilder = inject(FormBuilder);

  // Boolean flags
  protected phoneIsValid: boolean = false;

  // Data arrays
  protected deviceTypes: DeviceTypeInterface[] = [];
  protected companies: CompanyInterface[] = [];
  protected company?: CompanyInterface;
  protected serversLists: ServerInterface[] = [];

  // Event Emitters
  @Output() deviceFormGroupChange = new EventEmitter<FormGroup>();
  @Output() markerCoordsChange = new EventEmitter<Coordinates>();

  // Static device data
  protected deviceData = {
    hostname: '',
    ipAddress: '',
    port: '',
    apn: '',
    apnUsername: '',
    apnPassword: '',
    other: '',
  };

  // Markdown and related content
  protected markdownContent: string = '';
  protected paramsUrl: string = '';

  // Map-related variables
  protected markerCoords: Coordinates | null = null;

  // Signals (for Angular reactive updates)
  title = 'ngx-material-intl-tel-input';
  currentPhoneValue = signal<string>('');
  submittedPhoneValue = signal<string>('');
  showSetPhoneInput = signal<boolean>(false);

  // Localized text for phone input
  frenchTextLabels!: PhoneTextLabels;

  // Device information
  protected deviceInformation!: Device;

  // Subjects for unsubscribing from Observables
  private destroy$ = new Subject<void>();

  // Service
  private route = inject(ActivatedRoute);
  private devicesService = inject(DeviceService);
  public translate = inject(TranslateService);

  constructor(
    public dialogRef: MatDialogRef<FormDeviceComponent>,

    @Inject(MAT_DIALOG_DATA)
    public data: { device: Device; isAdd: boolean }
  ) {
    this.deviceInformation = data.device;
  }

  ngOnInit(): void {
    const primary = this.route.snapshot.root;
    const lastChild = this.getLastChild(primary);
    this.paramsUrl = lastChild.params['uid'];

    this.frenchTextLabels = {
      mainLabel: '',
      codePlaceholder: this.translate.instant('phoneNumber.codePlaceholder'),
      searchPlaceholderLabel: this.translate.instant(
        'phoneNumber.searchPlaceholderLabel'
      ),
      noEntriesFoundLabel: this.translate.instant(
        'phoneNumber.noEntriesFoundLabel'
      ),
      nationalNumberLabel: this.translate.instant(
        'phoneNumber.nationalNumberLabel'
      ),
      hintLabel: this.translate.instant('phoneNumber.hintLabel'),
      invalidNumberError: this.translate.instant(
        'phoneNumber.invalidNumberError'
      ),
      requiredError: this.translate.instant('phoneNumber.requiredError'),
    };

    const imeiValidatorFn = imeiValidator(
      this.devicesService,
      this.data.isAdd ? null : this.deviceInformation.imei
    );

    this.deviceFormGroup = this.formBuilder.group({
      imei: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{15,16}$')],
        [imeiValidatorFn],
      ],
      name: ['', [Validators.required, Validators.maxLength(150)]],
      car_name: ['', [Validators.required, Validators.maxLength(150)]],
      sim_number: [''],
      type: ['', [Validators.required]],
    });

    // Populate form fields if it's an edit operation
    if (!this.data.isAdd) {
      console.log("DEVICE INFO ", this.deviceInformation);
      
      this.deviceFormGroup.patchValue({
        imei: this.deviceInformation.imei,
        name: this.deviceInformation.name,
        car_name: this.deviceInformation.car_name,
        sim_number: this.deviceInformation.sim_number,
        type: this.deviceInformation.type.uid,
      });
    }

    this.deviceFormGroupChange.emit(this.deviceFormGroup);
    this.markerCoordsChange.emit(this.markerCoords ?? undefined);

    this.devicesService
      .getCompaniesById(this.paramsUrl)
      .subscribe((company) => {
        this.company = company;
      });

    this.devicesService.getDeviceTypes().subscribe((deviceTypes) => {
      this.deviceTypes = deviceTypes;
    });

    this.devicesService.getServerLists().subscribe((servers) => {
      this.serversLists = servers;
      if (servers.length > 0) {
        const firstServer = servers[0];
        this.deviceFormGroup.patchValue({
          server: firstServer.uid,
        });
        this.deviceFormGroup.get('server')?.disable();
        this.deviceData.ipAddress = firstServer.ip_address;
        this.deviceData.hostname = firstServer.hostname || '';
        this.deviceData.port = firstServer.port || '';
      }
    });

    this.deviceFormGroup.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.updateMarkdownContent();
    });

    this.deviceFormGroup
      .get('imei')
      ?.statusChanges.pipe(debounceTime(300))
      .subscribe((status) => {
        if (status === 'VALID') {
          const imei = this.deviceFormGroup.get('imei')?.value;

          if (imei) {
            this.updateMarkerCoords(imei);
          }
        }
      });
  }

  updateMarkerCoords(imei: string): void {
    this.devicesService.getDeviceLocationByIMEI(imei).subscribe({
      next: (response: DeviceLocationDataInterface) => {
        if (response && response.last_latitude && response.last_longitude) {
          this.markerCoords = {
            lat: parseFloat(response.last_latitude),
            lng: parseFloat(response.last_longitude),
          };
        } else {
          console.warn('Invalid response data:', response);
          this.markerCoords = null;
        }
      },
      error: (error) => {
        this.markerCoords = null;
      },
    });
  }

  handleFormValid(): void {
    this.updateMarkdownContent();
  }

  onDeviceTypeChange(typeUid: string): void {
    const selectedType = this.deviceTypes.find((type) => type.uid === typeUid);
    if (selectedType) {
      this.deviceData.port = selectedType.port;
      this.deviceFormGroup.patchValue({
        port: this.deviceData.port,
      });
      this.updateMarkdownContent();
    }
  }

  onServerChange(serverUID: string): void {
    const selectedServer = this.serversLists.find(
      (server) => server.uid === serverUID
    );
    if (selectedServer) {
      this.deviceData.ipAddress = selectedServer.ip_address;
      this.deviceData.hostname = selectedServer.hostname || '';
    }
  }

  submit(): void {
    if (this.deviceFormGroup.valid) {
      const deviceData = this.deviceFormGroup.value;
      const deviceAction = deviceData.uid
        ? this.devicesService.updateDevice(deviceData)
        : this.devicesService.createDevice(deviceData);

      deviceAction.subscribe({
        next: () => this.dialogRef.close(deviceData),
        error: (err) => console.error('Erreur lors de la soumission:', err),
      });
    }
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.markdownContent).then(
      () => {
        console.log('Markdown copied to clipboard');
      },
      (err) => {
        console.error('Failed to copy Markdown: ', err);
      }
    );
  }

  updateMarkdownContent(): void {
    const username = this.deviceFormGroup.get('username')?.value || 'APN';
    const password =
      this.deviceFormGroup.get('password')?.value || 'APN_Password';
    const hostname = this.deviceData.ipAddress || 'Domaine Ou Ip';
    const port = this.deviceData.port || 'Port';
    this.markdownContent = `
      **2001**: "internet"
      **2002**: ${username}
      **2003**: ${password}
      **2004**: ${hostname}
      **2005**: ${port}
      **2006**: 0
    `;
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPhoneValid(isValid: boolean): void {
    this.phoneIsValid = isValid;
  }

  /**
   * Sets the current phone value to the provided value.
   *
   * @param value - The new value for the current phone.
   */
  getValue(value: string): void {
    this.currentPhoneValue.set(value);
  }

  saveDeviceData(): void {
    if (this.deviceFormGroup.valid && this.company?.uid) {
      const deviceData: Device = this.deviceFormGroup.value;
      deviceData.company_manager = this.company;
      this.devicesService.setDeviceData(deviceData);
    }
  }

  getLastChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let child = route;
    while (child.firstChild) {
      child = child.firstChild;
    }
    return child;
  }
}
