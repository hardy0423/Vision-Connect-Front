import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { UserInterface } from '../../../../data/interfaces/user.interface';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  filter,
  finalize,
  merge,
  Observable,
  ReplaySubject,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { UserService } from '../../../../features/user/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { SharedModule } from '../../../../shared/shared.module';
import { ToastService } from 'angular-toastify';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private adminService = inject(AdminService);
  private activatedRoute = inject(ActivatedRoute);
  private userService = inject(UserService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  user$: Observable<UserInterface>;
  slugValue?: string;
  urlSlugValid!: string;
  isSlugExist: boolean = false;
  user!: UserInterface;
  name!: String;
  validationConfirmationPassword: boolean = false;
  protected loginForm!: FormGroup;

  public destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

  /**
   * set user
   */
  setUserInstance: (user: UserInterface) => void;

  passwordMatchValidator: ValidatorFn = (
    group: AbstractControl<FormGroup>
  ): ValidationErrors | null => {
    const password = group.get('password');
    const confirmPassword = group.get('confirm_password');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      return { passwordMismatch: true };
    }

    return null;
  };

  /**
   * send mail for password forgot
   */
  onForgotPasswordInstance: () => void;
  passwordVisible: boolean = false;

  constructor(private _toastService: ToastService) {
    const onSetUser: Subject<UserInterface> = new Subject<UserInterface>();
    this.setUserInstance = (user) => {
      onSetUser.next(user);
    };

    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });

    this.user$ = merge(
      onSetUser,
      this.activatedRoute.paramMap.pipe(
        filter((params) => params.get('slug') != undefined),
        switchMap((params: ParamMap) => {
          const slug = params.get('slug');
          if (slug) {
            this.slugValue = slug;
            return this.userService.getUserSlug(slug).pipe(
              catchError(() => {
                this._toastService.error(
                  this.translate.instant('accounts.login.alert.user_not_found')
                );
                return EMPTY;
              }),
              tap((user) => {
                this.validationConfirmationPassword = true;
                this.user = user;
                this.name = user.email ? user.email : user.username;
                this.loginForm = new FormGroup(
                  {
                    username: new FormControl('', [Validators.required]),
                    password: new FormControl('', [
                      Validators.required,
                      Validators.minLength(6),
                    ]),
                    confirm_password: new FormControl('', [
                      Validators.required,
                    ]),
                  }
                  // { validators: this.passwordMatchValidator }
                );

                const usernameControl = this.loginForm.get('username');
                if (usernameControl) {
                  usernameControl.setValue(
                    user.email ? user.email : user.username
                  );
                }
              })
            );
          } else {
            return throwError('Slug not found');
          }
        })
      )
    );

    this.user$.subscribe((user) => {
      this.isSlugExist = true;
    });

    this.onForgotPasswordInstance = () => {
      if (!this.loginForm.value.username) {
        this._toastService.error(
          this.translate.instant('accounts.login.mail_required_error')
        );
        return;
      }

      this.loginForm.disable();
      this.userService
        .userForgotPassword(this.loginForm.value.username)
        .pipe(
          take(1),
          catchError(() => {
            this._toastService.error(
              this.translate.instant('accounts.login.send_mail_error')
            );
            return EMPTY;
          }),
          tap(() => {
            this._toastService.success(
              this.translate.instant('accounts.login.mail_sent')
            );
          }),
          finalize(() => this.loginForm.enable())
        )
        .subscribe();
    };
  }

  submitForms() {
    if (!this.loginForm.invalid) {
      if (
        this.loginForm.value.password &&
        this.loginForm.value.confirm_password &&
        this.loginForm.value.password !== this.loginForm.value.confirm_password
      ) {
        this._toastService.error(
          this.translate.instant(
            'accounts.password_change.input.password2.message2'
          )
        );
        return;
      }

      if (this.slugValue) {
        this.adminService.updateUserPassword(this.loginForm.value).subscribe({
          next: (response) => {
            this._toastService.success(
              this.translate.instant(
                'accounts.password_change.password_changed'
              )
            );
          },
          error: (error) => {
            const errorMessage =
              error.error?.message ||
              this.translate.instant(
                'accounts.modal.error.profile_update_failed'
              );
            this._toastService.error(errorMessage);
          },
          complete: () => {
            console.log('Terminate');
          },
        });
      } else {
        this.adminService.login(this.loginForm.value).subscribe({
          next: (response) => {
            this._toastService.success(
              this.translate.instant('accounts.login.success.success_login')
            );
            this.router.navigate(['']);
          },
          error: (error) => {
            this._toastService.error(
              this.translate.instant('accounts.login.alert.error_400')
            );
          },
          complete: () => {
            console.log('Login complete');
          },
        });
      }
    } else {
      console.log('this.loginForm.invalid', this.loginForm.invalid);
    }
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  trimUsername() {
    const username = this.loginForm.get('username')?.value || '';
    this.loginForm.patchValue(
      { username: username.trim() },
      { emitEvent: false }
    );
  }
}
