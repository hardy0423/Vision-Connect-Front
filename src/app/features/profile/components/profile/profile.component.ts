import { Component, Inject, inject, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../user/services/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from 'angular-toastify';
import {
  UserInterface,
  UserWithCompanyDetailInterface,
} from '../../../../data/interfaces/user.interface';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  // ----------- FORM & USER DATA -----------
  public profileForm: FormGroup;
  public userId: string = '';
  public currentEmail: string = '';
  public isPasswordUpdate: boolean = false;
  public userInformation!: UserInterface;

  // ----------- FORM STATES & FLAGS -----------
  public showPasswordFields: boolean = false;
  public passwordMismatch: boolean = false;
  public isAdministrator: boolean = false;

  // ----------- ORIGINAL USER DATA (for comparison) -----------
  private originalFirstName: string = '';
  private originalLastName: string = '';
  private originalEmail: string = '';

  // ----------- SERVICES -----------
  private _toastService = inject(ToastService);
  private translate = inject(TranslateService);

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA)
    public data: { user: UserWithCompanyDetailInterface; isAdd: boolean }
  ) {
    this.profileForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(5)]],
      confirmPassword: [''],
    });
  }

  ngOnInit(): void {
    if (this.data.user) {
      this.isAdministrator = true;
      this.setInitialValues(this.data.user);
    } else {
      this.userService.getUser().subscribe((user) => {
        this.setInitialValues(user);
      });
    }
  }

  private setInitialValues(user: UserWithCompanyDetailInterface): void {
    this.userId = user.uid!;
    this.currentEmail = user.email!;
    this.originalFirstName = user.first_name!.trim();
    this.originalLastName = user.last_name!.trim();
    this.originalEmail = user.email!.trim();

    this.profileForm.patchValue({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    });
  }

  // Function to toggle password fields visibility and required validation
  togglePasswordFields(): void {
    this.showPasswordFields = !this.showPasswordFields;
    this.isPasswordUpdate = !this.isPasswordUpdate;

    if (this.showPasswordFields) {
      this.profileForm
        .get('currentPassword')
        ?.setValidators(Validators.required);
      this.profileForm
        .get('newPassword')
        ?.setValidators([Validators.required, Validators.minLength(5)]);
      this.profileForm
        .get('confirmPassword')
        ?.setValidators(Validators.required);
    } else {
      // Clear validators when hiding password fields
      this.profileForm.get('currentPassword')?.clearValidators();
      this.profileForm.get('newPassword')?.clearValidators();
      this.profileForm.get('confirmPassword')?.clearValidators();
    }

    this.profileForm.get('currentPassword')?.updateValueAndValidity();
    this.profileForm.get('newPassword')?.updateValueAndValidity();
    this.profileForm.get('confirmPassword')?.updateValueAndValidity();
  }

  onCancel(): void {
    this.dialog.closeAll();
  }

  onSubmit(): void {
    const { newPassword, confirmPassword } = this.profileForm.value;

    // Check if the new and confirm passwords match
    if (newPassword !== confirmPassword) {
      this.passwordMismatch = true;
      return;
    }
    this.passwordMismatch = false;

    const updatedUserData = {
      ...this.profileForm.value,
      uid: this.userId,
      update_password: this.isPasswordUpdate,
    };

    this.userService.editUserProfileWithPassword(updatedUserData).subscribe({
      next: (response) => {
        this._toastService.success(
          this.translate.instant('accounts.modal.success.profile_updated')
        );
        this.dialog.closeAll();
      },
      error: (error) => {
        if (error) {
          const errorMessage =
            error ||
            this.translate.instant('accounts.password_change.error_changed');
          this._toastService.error(errorMessage);
        }
      },
      complete: () => {
        console.log('Request completed');
      },
    });
  }

  isSaveDisabled(): boolean {
    const formValues = this.profileForm.value;
    return (
      formValues.first_name.trim() === this.originalFirstName &&
      formValues.last_name.trim() === this.originalLastName &&
      formValues.email.trim() === this.originalEmail &&
      !this.showPasswordFields
    );
  }
}
