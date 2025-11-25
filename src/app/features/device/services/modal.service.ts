import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormDeviceComponent } from '../components/add-device/add-device.component';
import { Device } from '../models/device';
import { CommandComponent } from '../components/command/command.component';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(private dialog: MatDialog) {}

  openModal(
    isAdd: boolean,
    deviceData: Device,
    idCompany: string | null
  ): void {
    console.log("DATA ", deviceData);
    
    const dialogRef = this.dialog.open(FormDeviceComponent, {
      width: '80%',
      maxHeight: '99vh',
      data: { isAdd: isAdd, device: deviceData, idCompany: idCompany },
      hasBackdrop: true,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Device modal closed with result:', result);
      }
    });
  }

  openCommandModal(deviceData: Device): void {
    const dialogRef = this.dialog.open(CommandComponent, {
      width: '60%',
      height: '50%',
      data: { device: deviceData },
      hasBackdrop: true,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Device modal closed with result:', result);
      }
    });
  }
}
