import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../shared/shared.module';
import { DeviceService } from '../../services/device.service';
import {
  Device,
  DeviceCommand,
  DeviceInfo,
  DeviceStatusKey,
  FieldDescriptions,
  GetDeviceInfo,
  GetDeviceStatus,
  SelectedCommand,
} from '../../models/device';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'angular-toastify';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-command',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './command.component.html',
  styleUrls: ['./command.component.scss'],
})
export class CommandComponent implements OnInit {
  // ========== State Flags ==========
  public isEngineStopped = false;
  public isLoading = false;
  public isGetInfoLoading = false;
  public isGetStatusLoading = false;
  public isGetGpsLoading = false;

  // ========== Device Data ==========
  public deviceData!: Device;
  public selectedCommand: SelectedCommand | null = null;
  public speedLimit?: number;

  // ========== Device Responses ==========
  public deviceInfo!: DeviceInfo;
  public fieldsToDisplay!: GetDeviceInfo;
  public devicePosition!: DeviceInfo;
  public deviceImmobilizer!: DeviceInfo;
  public deviceStatus!: DeviceStatusKey;

  // ========== Error Messages ==========
  public errorDeviceInfo: string = '';
  public errorDeviceStatus: string = '';
  public errorDeviceEnginImmobilizer: string = '';
  public errorDevicePosition: string = '';

  // ========== Command IDs ==========
  private readonly COMMAND_ID_INFO = 121;
  private readonly COMMAND_ID_MODEM_STATUS = 212;
  private readonly COMMAND_ID_ANTI_START = 323;
  private readonly COMMAND_ID_SPEED_LIMIT = 434;
  private readonly COMMAND_ID_VEHICLE_POSITION = 545;

  // ========== Services ==========
  private readonly _toastService = inject(ToastService);

  constructor(
    private translate: TranslateService,
    private readonly deviceService: DeviceService,
    private readonly dialogRef: MatDialogRef<CommandComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { device: Device }
  ) {
    this.deviceData = data.device;
  }

  ngOnInit(): void {
    if (this.deviceData.uid) {
      this.deviceService.getDeviceByUid(this.deviceData.uid).subscribe({
        next: (device) => {
          this.isEngineStopped = device.engine_lock;
          this.speedLimit = device.speed_limit;
        },
        error: (error) =>
          console.error('Erreur lors de la récupération du dispositif', error),
      });
    }
  }

  selectCommand(command: SelectedCommand) {
    this.selectedCommand = command;
    if (command.id === 121) {
      this.viewDeviceInfo();
    } else if (command.id === 212) {
      this.viewDeviceStatus();
    } else if (command.id === 545) {
      this.viewDevicePosition();
    }
  }

  toggleEngine(event: MatSlideToggleChange) {
    // See https://wiki.teltonika-gps.com/view/FMB_setigndigout
    this.isLoading = true;
    const newState = event.checked;
    let command: string = '';
    if (!newState) {
      // command = 'setdigout 1 0 ? ? ? ?';
      command = 'setigndigout 1 ? ? 0 0 0';
    } else {
      // command = 'setdigout 0 0 ? ? ? ?';
      command = 'setigndigout 0 ? ? 0 0 0';
    }

    this.deviceService
      .toggleEngineCommand(command, this.deviceData.uid!)
      .subscribe({
        next: (response) => {
          this.isEngineStopped = newState;
          this.isLoading = false;
          this.deviceImmobilizer = response.response;
          this._toastService.info(
            this.translate.instant(
              newState
                ? 'device.command.success.engineDisabled'
                : 'device.command.success.engineEnabled'
            )
          );
        },
        error: (error) => {
          this.errorDeviceEnginImmobilizer = error.message;
          this.isLoading = false;
        },
      });
  }

  getDeviceEngineImmobilizeDescriptions() {
    const descriptions: FieldDescriptions = this.getDescriptionsImmobilizer();
    if (!this.deviceImmobilizer) {
      return [];
    }
    return Object.keys(this.deviceImmobilizer)
      .filter((key) => descriptions[key as keyof FieldDescriptions])
      .map((key) => ({
        key,
        description: descriptions[key as keyof FieldDescriptions],
        value: this.deviceImmobilizer[key],
      }));
  }

  getDescriptionsImmobilizer() {
    return {
      DOUT1: this.translate.instant(
        'device.command.get_immobilizer_info.DOUT1'
      ),
      DOUT2: this.translate.instant(
        'device.command.get_immobilizer_info.DOUT2'
      ),
      DOUT3: this.translate.instant(
        'device.command.get_immobilizer_info.DOUT3'
      ),
      Timeout: this.translate.instant(
        'device.command.get_immobilizer_info.Timeout'
      ),
    };
  }

  applySpeedLimit() {
    if (this.speedLimit == null) return;
    const command: DeviceCommand = { speed_limit: this.speedLimit };

    this.deviceService
      .speedLimiteCommand(command, this.deviceData.uid!)
      .subscribe({
        next: () => {},
        error: () => {},
      });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  viewDeviceInfo() {
    this.isGetInfoLoading = true;
    if (!this.deviceData.uid) {
      this.isGetInfoLoading = false;
      return;
    }

    this.deviceService.getDeviceInfo(this.deviceData.uid).subscribe({
      next: (response) => {
        this.isGetInfoLoading = false;
        this.deviceInfo = response.response;
      },
      error: (error) => {
        this.errorDeviceInfo = error.message;
        this.isGetInfoLoading = false;
      },
    });
  }

  getDeviceInfoDescriptions() {
    const descriptions: FieldDescriptions = this.getDescriptions();
    if (!this.deviceInfo) {
      return [];
    }
    return Object.keys(this.deviceInfo)
      .filter((key) => descriptions[key as keyof FieldDescriptions])
      .map((key) => ({
        key,
        description: descriptions[key as keyof FieldDescriptions],
        value: this.deviceInfo[key],
      }));
  }

  getDescriptions() {
    return {
      RTC: this.translate.instant('device.command.get_info_data.RTC'),
      Init: this.translate.instant('device.command.get_info_data.Init'),
      UpTime: this.translate.instant('device.command.get_info_data.UpTime'),
      PWR: this.translate.instant('device.command.get_info_data.PWR'),
      RST: this.translate.instant('device.command.get_info_data.RST'),
      GPS: this.translate.instant('device.command.get_info_data.GPS'),
      SAT: this.translate.instant('device.command.get_info_data.SAT'),
      TTFF: this.translate.instant('device.command.get_info_data.TTFF'),
      TTLF: this.translate.instant('device.command.get_info_data.TTLF'),
      NOGPS: this.translate.instant('device.command.get_info_data.NOGPS'),
      SR: this.translate.instant('device.command.get_info_data.SR'),
      FG: this.translate.instant('device.command.get_info_data.FG'),
      FL: this.translate.instant('device.command.get_info_data.FL'),
      SMS: this.translate.instant('device.command.get_info_data.SMS'),
      REC: this.translate.instant('device.command.get_info_data.REC'),
      MD: this.translate.instant('device.command.get_info_data.MD'),
      DB: this.translate.instant('device.command.get_info_data.DB'),
    };
  }

  // DEVICE STATUS

  viewDeviceStatus() {
    this.isGetStatusLoading = true;
    if (!this.deviceData.uid) {
      this.isGetStatusLoading = false;
      return;
    }

    this.deviceService.getDeviceStatus(this.deviceData.uid).subscribe({
      next: (response) => {
        this.isGetStatusLoading = false;
        this.deviceStatus = response.response;
      },
      error: (error) => {
        this.errorDeviceStatus = error.message;
        this.isGetStatusLoading = false;
      },
    });
  }

  getDeviceStatusDescriptions() {
    const descriptions: FieldDescriptions = this.getDescriptionsStatus();
    if (!this.deviceStatus) {
      return [];
    }
    return Object.keys(this.deviceStatus)
      .filter((key) => descriptions[key as keyof FieldDescriptions])
      .map((key) => ({
        key,
        description: descriptions[key as keyof FieldDescriptions],
        value: this.deviceStatus[key],
      }));
  }

  getDescriptionsStatus() {
    return {
      GPRS: this.translate.instant('device.command.get_status_data.GPRS'),
      Phone: this.translate.instant('device.command.get_status_data.Phone'),
      SIM: this.translate.instant('device.command.get_status_data.SIM'),
      OP: this.translate.instant('device.command.get_status_data.OP'),
      Signal: this.translate.instant('device.command.get_status_data.Signal'),
      NewSMS: this.translate.instant('device.command.get_status_data.NewSMS'),
      Roaming: this.translate.instant('device.command.get_status_data.Roaming'),
      SMSFull: this.translate.instant('device.command.get_status_data.SMSFull'),
      LAC: this.translate.instant('device.command.get_status_data.LAC'),
      Cell: this.translate.instant('device.command.get_status_data.Cell'),
      NetType: this.translate.instant('device.command.get_status_data.NetType'),
      FwUpd: this.translate.instant('device.command.get_status_data.FwUpd'),
      Link: this.translate.instant('device.command.get_status_data.Link'),
    };
  }

  viewDevicePosition() {
    this.isGetGpsLoading = true;
    if (!this.deviceData.uid) {
      this.isGetGpsLoading = false;
      console.error('Device UID is missing');
      return;
    }

    this.deviceService.getDevicePosition(this.deviceData.uid).subscribe({
      next: (response) => {
        this.isGetGpsLoading = false;
        this.devicePosition = response.response;
      },
      error: (error) => {
        this.errorDevicePosition = error.message;
        this.isGetGpsLoading = false;
      },
    });
  }

  getDeviceGpsDescriptions() {
    const descriptions: FieldDescriptions = this.getDescriptionsPosition();
    if (!this.devicePosition) {
      return [];
    }
    return Object.keys(this.devicePosition)
      .filter((key) => descriptions[key as keyof FieldDescriptions])
      .map((key) => ({
        key,
        description: descriptions[key as keyof FieldDescriptions],
        value: this.devicePosition[key],
      }));
  }

  getDescriptionsPosition() {
    return {
      D: this.translate.instant('device.command.get_position_data.D'),
      T: this.translate.instant('device.command.get_position_data.T'),
      S: this.translate.instant('device.command.get_position_data.S'),
      C: this.translate.instant('device.command.get_position_data.C'),
      Url: this.translate.instant('device.command.get_position_data.Url'),
    };
  }

  getCommandList() {
    const commandIds = [
      this.COMMAND_ID_INFO,
      this.COMMAND_ID_MODEM_STATUS,
      this.COMMAND_ID_ANTI_START,
      this.COMMAND_ID_SPEED_LIMIT,
      this.COMMAND_ID_VEHICLE_POSITION,
    ];

    return commandIds.map((id) => {
      const nameKey = `device.command.command_list.name_${id}`;
      const descriptionKey = `device.command.command_list.description_${id}`;

      return {
        id: id,
        name: this.translate.instant(nameKey),
        description: this.translate.instant(descriptionKey),
        disable: false,
        icon: this.getIconForCommand(id),
        command: this.getCommandForId(id),
      };
    });
  }

  getIconForCommand(id: number) {
    switch (id) {
      case this.COMMAND_ID_INFO:
        return 'info';
      case this.COMMAND_ID_MODEM_STATUS:
        return 'fa-signal';
      case this.COMMAND_ID_ANTI_START:
        return 'fa fa-lock';
      case this.COMMAND_ID_SPEED_LIMIT:
        return 'fa fa-tachometer-alt';
      case this.COMMAND_ID_VEHICLE_POSITION:
        return 'fa fa-tachometer-alt';
      default:
        return 'fa-question-circle';
    }
  }

  getCommandForId(id: number) {
    switch (id) {
      case this.COMMAND_ID_INFO:
        return 'getinfo';
      case this.COMMAND_ID_MODEM_STATUS:
        return 'getstatus';
      case this.COMMAND_ID_ANTI_START:
        return 'getanti_start';
      case this.COMMAND_ID_SPEED_LIMIT:
        return 'set_speed_limit';
      case this.COMMAND_ID_VEHICLE_POSITION:
        return 'get_vehicle_position';
      default:
        return '';
    }
  }
}
