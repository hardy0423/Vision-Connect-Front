import { Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../../../shared/shared.module';
import { UserService } from '../../../user/services/user.service';
import { UserInterface } from '../../../../data/interfaces/user.interface';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'angular-toastify';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-total-device',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './total-device.component.html',
  styleUrl: './total-device.component.scss',
})
export class TotalDeviceComponent implements OnInit {
  fmapNbrDevice: number = 0;
  private userService = inject(UserService);
  private companyService = inject(CompanyService);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);

  constructor(public dialogRef: MatDialogRef<TotalDeviceComponent>) {}

  ngOnInit(): void {
    this.userService
      .getUserFmapInformation()
      .subscribe((user: UserInterface) => {
        this.fmapNbrDevice = user.companies?.nbr_device || 0;
      });
  }

  onSave(): void {
    this.companyService.updateTotalDevice(this.fmapNbrDevice).subscribe({
      next: () => {
        this.toastService.success(
          this.translate.instant('user.success_updating_device_fmap')
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.toastService.error(
          this.translate.instant('user.error.device_update_failed')
        );
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
