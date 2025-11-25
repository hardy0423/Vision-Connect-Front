import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { UserInterface } from '../../../data/interfaces/user.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'angular-toastify';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { UserService } from '../../user/services/user.service';
import { NoWhitespaceValidator } from '../../../shared/error/error.component';
import { emailExistsValidator } from '../../../data/utils/validator-utils';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-form-fields',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './admin-form-fields.component.html',
  styleUrl: './admin-form-fields.component.scss',
})
export class AdminFormFieldsComponent implements OnInit {
  companies: any;
  is_superUser: boolean = false;
  errorMessage: string | null = null;
  protected paramsUrl: string = '';

  protected userInformation!: UserInterface;
  protected companiesInformation: any;
  protected adminFormGroup!: FormGroup;
  userData!: UserInterface;

  // **Services**
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private _toastService = inject(ToastService);
  private _translateService = inject(TranslateService);

  constructor(public dialogRef: MatDialogRef<AdminFormFieldsComponent>) {}
  ngOnInit(): void {
    const primary = this.route.snapshot.root;
    const lastChild = this.getLastChild(primary);
    this.paramsUrl = lastChild.params['uid'];
    this.adminFormGroup = this.formBuilder.group({
      first_name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          NoWhitespaceValidator(),
        ],
      ],
      last_name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          NoWhitespaceValidator(),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email],
        [emailExistsValidator(this.userService, null)],
      ],
      is_admin: [true],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.adminFormGroup.valid) {
      this.adminFormGroup.patchValue({ is_admin: true });

      this.userService
        .createAdministrator(this.adminFormGroup.value)
        .subscribe({
          next: (response) => {
            this._toastService.success(
              this._translateService.instant(
                'user.admin.success_creating_admin'
              )
            );
            this.userService.setSaveUserInfo(true);
            this.dialogRef.close(response);
          },
          error: (error) => {
            this.userService.setSaveUserInfo(false);
            this.errorMessage = error?.message
              ? error.message.replace('Error: ', '')
              : 'Une erreur est survenue.';

            this._toastService.error(
              this._translateService.instant('user.admin.error_creating_admin')
            );
          },
        });
    } else {
      this._toastService.error(
        this._translateService.instant('user.error_invalid_form')
      );
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
