
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PhoneTextLabels } from '../../../data/interfaces/phone.interface';


@Component({
  selector: 'app-phone-form-fields',
  standalone: true,
  imports: [
    NgxMaterialIntlTelInputComponent,
    MatChipsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    TranslateModule],
  templateUrl: './phone-form-fields.component.html',
  styleUrl: './phone-form-fields.component.scss',
})


export class PhoneFormFieldsComponent implements OnInit{
  title = 'ngx-material-intl-tel-input';
  currentPhoneValue = signal<string>('');
  submittedPhoneValue = signal<string>('');
  formPhoneNumberGroup: FormGroup;
  showSetPhoneInput = signal<boolean>(false);

  frenchTextLabels!: PhoneTextLabels;
  @Output() phoneValid: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private fb: FormBuilder, 
    public translate: TranslateService,
  ) {
    this.formPhoneNumberGroup = this.fb.group({
      phone: ['', [Validators.required]],
      setPhoneTextbox: ['']
    });
  }

  ngOnInit(): void {
    this.frenchTextLabels = {
      mainLabel:"",
      codePlaceholder: this.translate.instant('phoneNumber.codePlaceholder'),
      searchPlaceholderLabel: this.translate.instant('phoneNumber.searchPlaceholderLabel'),
      noEntriesFoundLabel: this.translate.instant('phoneNumber.noEntriesFoundLabel'),
      nationalNumberLabel: this.translate.instant('phoneNumber.nationalNumberLabel'),
      hintLabel: this.translate.instant('phoneNumber.hintLabel'),
      invalidNumberError: this.translate.instant('phoneNumber.invalidNumberError'),
      requiredError: this.translate.instant('phoneNumber.requiredError')
    };

    this.formPhoneNumberGroup.get('phone')?.valueChanges.subscribe(value => {
      this.emitPhoneValidity();
    });
  }


  /**
   * Sets the current phone value to the provided value.
   *
   * @param value - The new value for the current phone.
   */
  getValue(value: string): void {
    this.currentPhoneValue.set(value);
  }

  /**
   * Submits the form data by setting the submitted phone value to the current phone value from the form group.
   */
  onSubmit(): void {
    this.submittedPhoneValue.set(this.formPhoneNumberGroup.value['phone']);
  }

  /**
   * Sets the phone control value to the value entered in the 'setPhoneTextbox' control.
   */
  setPhone(): void {
    this.formPhoneNumberGroup.controls['phone'].setValue(
      this.formPhoneNumberGroup.value['setPhoneTextbox']
    );
  }

  /**
   * Toggles the visibility of the set phone input field.
   */
  toggleShowSetPhoneInput(): void {
    this.showSetPhoneInput.set(!this.showSetPhoneInput());
  }


  emitPhoneValidity(): void {
    const isValid = this.formPhoneNumberGroup.get('phone')?.valid ?? false;
    this.phoneValid.emit(isValid); // Emit validity status
  }
}

