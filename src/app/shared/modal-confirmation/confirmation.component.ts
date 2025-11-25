import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [TranslateModule, CommonModule,MatButtonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent {
  title: string = '';
  message: string = '';
  message_confirmation: string = '';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Input() buttonColor: string = 'bg-red-600'; //valeur par défaut

  constructor(private translate: TranslateService) {
    this.loadTranslations();
  }

  loadTranslations() {
    this.title = this.translate.instant('sidebar.logout.header');
    this.message = this.translate.instant('sidebar.logout.message');
    this.message_confirmation = 'modal.confirmation';
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
