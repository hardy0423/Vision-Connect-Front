import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedModule } from '../../../shared/shared.module';
import { DeviceService } from '../../device/services/device.service';
import { UserInterface } from '../../../data/interfaces/user.interface';
import { emailExistsValidator } from '../../../data/utils/validator-utils';
import { UserService } from '../../user/services/user.service';
import { NoWhitespaceValidator } from '../../../shared/error/error.component';
import { CompanyInterface } from '../../../data/interfaces/company.interface';
import { AdminService } from '../../../core/auth/services/admin.service';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { ToastService } from 'angular-toastify';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CommonModule,
    SharedModule,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  public companies: any;
  public is_superUser: boolean = false;
  public errorMessage: string | null = null;
  protected paramsUrl: string = '';
  protected company?: CompanyInterface;
  protected companyList?: CompanyInterface[];

  protected userInformation!: UserInterface;
  protected companiesInformation: any;
  protected userFormGroup!: FormGroup;
  userData!: UserInterface;

  // **Services**
  private devicesService = inject(DeviceService);
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);
  private _toastService = inject(ToastService);
  private _translateService = inject(TranslateService);

  constructor(
    public dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { user: UserInterface; isAdd: boolean }
  ) {
    this.userInformation = data.user;
  }
  ngOnInit(): void {
    const primary = this.route.snapshot.root;
    const lastChild = this.getLastChild(primary);
    this.paramsUrl = lastChild.params['uid'];

    const currentEmail = this.data.isAdd ? null : this.userInformation.email;
    this.userFormGroup = this.formBuilder.group({
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
        [emailExistsValidator(this.userService, currentEmail)],
      ],
      companies: [null, [Validators.required]],
      is_admin: [true],
    });

    if (!this.data.isAdd) {
      this.userFormGroup.patchValue({
        first_name: this.userInformation.first_name,
        last_name: this.userInformation.last_name,
        email: this.userInformation.email,
        companies: this.userInformation.companies,
      });
    }

    if (this.paramsUrl) {
      this.devicesService
        .getCompaniesById(this.paramsUrl)
        .subscribe((company) => {
          this.companyList = [company];
          this.userFormGroup.patchValue({
            companies: company.uid,
          });
        });
    } else {
      this.devicesService.getCompanies().subscribe((companies) => {
        this.companyList = companies;
        this.companyList = this.companyList.sort((a, b) => {
          if (a.default_company === b.default_company) return 0;
          return a.default_company ? -1 : 1;
        });

        const defaultCompany = companies.find(
          (c) => c.default_company === true
        );
        if (defaultCompany) {
          this.userFormGroup.patchValue({
            is_admin: true,
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.userFormGroup.valid && !this.data.isAdd) {
      const idUser = this.userInformation.uid;
      const updatedUserData = {
        ...this.userFormGroup.value,
        uid: idUser,
      };

      this.userService.updateUser(updatedUserData).subscribe({
        next: (response) => {
          this._toastService.success(
            this._translateService.instant('user.success_updating_user')
          );
          this.userService.setSaveUserInfo(true);
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.userService.setSaveUserInfo(false);
          this.errorMessage = error.message.replace('Error: ', '');
          this._toastService.error(
            this._translateService.instant('user.error_updating_user')
          );
        },
      });
    } else if (this.userFormGroup.valid) {
      const selectedCompanyUid = this.userFormGroup.value.companies;
      const selectedCompany = this.companyList!.find(
        (c) => c.uid === selectedCompanyUid
      );

      const payload = {
        ...this.userFormGroup.value,
        is_admin: selectedCompany?.default_company || false,
      };

      this.userService.createUser(payload).subscribe({
        next: (response) => {
          this._toastService.success(
            this._translateService.instant('user.success_creating_user')
          );
          this.userService.setSaveUserInfo(true);
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.userService.setSaveUserInfo(false);
          this.errorMessage = error.message.replace('Error: ', '');
          this._toastService.error(
            this._translateService.instant('user.error_creating_user')
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
