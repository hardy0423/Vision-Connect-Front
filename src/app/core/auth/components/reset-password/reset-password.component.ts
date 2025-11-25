import { Component, inject } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { UserService } from '../../../../features/user/services/user.service';
import { TranslateService } from '@ngx-translate/core';
import {
  catchError,
  EMPTY,
  finalize,
  ReplaySubject,
  Subject,
  take,
  tap,
} from 'rxjs';
import { UserInterface } from '../../../../data/interfaces/user.interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'angular-toastify';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private userService = inject(UserService);
  private translate = inject(TranslateService);
  protected resetPasswordForm!: FormGroup;
  protected isSubmitted = false;

  public destroyed$: ReplaySubject<boolean> = new ReplaySubject(1);

  /**
   * set user
   */
  setUserInstance: (user: UserInterface) => void;

  /**
   * send mail for password forgot
   */
  onForgotPasswordInstance: () => void;

  constructor(private _toastService: ToastService) {
    const onSetUser: Subject<UserInterface> = new Subject<UserInterface>();
    this.setUserInstance = (user) => {
      onSetUser.next(user);
    };

    this.resetPasswordForm = new FormGroup({
      username_email: new FormControl('', [Validators.required]),
    });

    this.onForgotPasswordInstance = () => {
      if (!this.resetPasswordForm.value.username_email) {
        this._toastService.error(
          this.translate.instant('accounts.reset_password.email_required')
        );
        return;
      }

      this.resetPasswordForm.disable();
      this.userService
        .userForgotPassword(this.resetPasswordForm.value.username_email)
        .pipe(
          take(1),
          catchError(() => {
            this._toastService.error(
              this.translate.instant('accounts.login.send_mail_error')
            );
            return EMPTY;
          }),
          tap(() => {
            this.isSubmitted = true;
            this._toastService.success(
              this.translate.instant('accounts.login.mail_sent')
            );
          }),
          finalize(() => this.resetPasswordForm.enable())
        )
        .subscribe();
    };
  }

  trimUsername() {
    const username_email =
      this.resetPasswordForm.get('username_email')?.value || '';
    this.resetPasswordForm.patchValue(
      { username_email: username_email.trim() },
      { emitEvent: false }
    );
  }
}
