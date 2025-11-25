import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap, } from 'rxjs/operators';
import { DeviceService } from '../../features/device/services/device.service';
import { UserService } from '../../features/user/services/user.service';
import { CompanyService } from '../../features/company/services/company.service';

export function imeiValidator(
  deviceService: DeviceService,
  deviceImei: string | null = null
): ValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value) {
      return new Observable((observer) => {
        observer.next(null);
        observer.complete();
      });
    }

    // Check if the current value matches the existing IMEI in edit mode
    if (deviceImei && control.value === deviceImei) {
      return new Observable((observer) => {
        observer.next(null);
        observer.complete();
      });
    }

    // Check IMEI existence
    return deviceService
      .checkIMEIExists(control.value)
      .pipe(map((exists: boolean) => (exists ? { imeiExists: true } : null)));
  };
}


export function emailExistsValidator(userService: UserService,  currentEmail?: string | null ): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value === currentEmail) {
      
      return of(null);
    }
    return of(control.value).pipe(
      debounceTime(300), // Évite les appels multiples en cas de frappe rapide
      switchMap((email) =>
        userService.checkEmailExists(email).pipe(
          map((response) => {
            return response ? { emailExists: true } : null;
          }),
          catchError((error) => {
            return of(null);
          })
        )
      )
    );
  };
}



export function emailCompanyExistsValidator(companyService: CompanyService,  currentEmail?: string | null ): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value === currentEmail) {
      return of(null);
    }
    return of(control.value).pipe(
      debounceTime(300), // Évite les appels multiples en cas de frappe rapide
      switchMap((email) =>
        companyService.checkEmailExists(email).pipe(
          map((response) => {
            return response ? { emailExists: true } : null;
          }),
          catchError((error) => {
            console.error('Error checking email existence:', error);
            return of(null);
          })
        )
      )
    );
  };
}


export function nombredeviceValidator(companyService: CompanyService,  currentEmail: string, curreNumber:number): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    if (!control.value || control.value === curreNumber) {
      return of(null);
    }

    return of(control.value).pipe(
      debounceTime(300),
      switchMap((number) => 
        companyService.checkSommeTotalDevice(number, currentEmail).pipe(
          map((response) => {
            if (!response.valid) {
              return { invalidDeviceNumber: response.message };
            }
            return null;
          }),
          catchError((error) => {
            return of({ invalidDeviceNumber: 'Une erreur est survenue lors de la vérification des dispositifs.' });
          })
        )
      )
    );
  };
}