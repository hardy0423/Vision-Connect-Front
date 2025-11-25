import { Component, Inject, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { CompanyInterface } from '../../../data/interfaces/company.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { Country } from '../../company/models/country.interface';
import { CompanyService } from '../../company/services/company.service';
import { TranslateService } from '@ngx-translate/core';
import { SharedModule } from '../../../shared/shared.module';
import {
  emailCompanyExistsValidator,
  nombredeviceValidator,
} from '../../../data/utils/validator-utils';
import { UserService } from '../../user/services/user.service';
import { UserInterface } from '../../../data/interfaces/user.interface';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    SharedModule,
  ],
  templateUrl: './company-form.component.html',
  styleUrl: './company-form.component.scss',
})
export class CompanyFormComponent implements OnInit {
  // === Form Groups ===
  protected companyFormGroup!: FormGroup;

  // === Properties ===
  public companies: any;
  public countries!: Country[];
  public emailExist: string = '';
  public numberDevice: number = 0;
  userInformation!: UserInterface;

  // === Flags and States ===
  public isAdminOrSuperUser: boolean = false;
  public isVisionConnect: boolean = false;
  public errorMessage: string | null = null;

  // **Services**
  private companyService = inject(CompanyService);
  private translate = inject(TranslateService);
  protected companyInformation!: CompanyInterface;
  private userService = inject(UserService);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CompanyFormComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { isAdd: boolean; companies: CompanyInterface }
  ) {
    this.companyInformation = data.companies;
  }
  ngOnInit(): void {
    const currentEmail = this.data.isAdd ? null : this.companyInformation.email;
    const currentNumber = this.data.isAdd
      ? null
      : this.companyInformation.nbr_device;
    if (currentEmail) {
      this.emailExist = currentEmail;
    }
    if (currentNumber) {
      this.numberDevice = currentNumber;
    }

    this.companyFormGroup = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      email: [
        '',
        [Validators.email, Validators.required, Validators.maxLength(150)],
        emailCompanyExistsValidator(this.companyService, currentEmail),
      ],
      region: ['', [Validators.maxLength(150)]],
      adress: ['', [Validators.maxLength(250)]],
      country: [null, [Validators.required]],
      nbr_device: [
        0,
        [Validators.required, Validators.min(1)],
        nombredeviceValidator(
          this.companyService,
          this.emailExist,
          this.numberDevice
        ),
      ],
    });

    if (!this.data.isAdd) {
      this.companyFormGroup.patchValue({
        name: this.companyInformation.name,
        email: this.companyInformation.email,
        region: this.companyInformation.region,
        adress: this.companyInformation.adress,
        country: this.companyInformation.country?.id,
        nbr_device: this.companyInformation.nbr_device,
      });
    }

    this.companyService.getCountries().subscribe((country) => {
      this.countries = country;
    });

    this.userService.getUser().subscribe((user) => {
      this.isVisionConnect = user.is_admin;
      this.isAdminOrSuperUser = user.is_superuser || user.is_admin;
    });
  }

  onCancel(): void {
    this.dialogRef.close(); // Ferme la boîte de dialogue
  }

  onSave(): void {
    if (this.companyFormGroup.valid && !this.data.isAdd) {
      const idCompany = this.companyInformation.uid;
      const updatedCompanyData = {
        ...this.companyFormGroup.value,
        uid: idCompany,
      };

      this.companyService.updateCompany(updatedCompanyData).subscribe({
        next: (response) => {
          this.companyService.setSaveCompanyInfo(true);
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.errorMessage = error.message.replace('Error: ', '');
        },
      });
    } else if (this.companyFormGroup.valid) {
      this.companyService.createCompany(this.companyFormGroup.value).subscribe({
        next: (response) => {
          this.companyService.setSaveCompanyInfo(true);
          this.dialogRef.close(response);
        },
        error: (error) => {
          this.errorMessage = error.message.replace('Error: ', '');
        },
      });
    } else {
      console.log('Form is invalid', this.companyFormGroup.value);
    }
  }
}
