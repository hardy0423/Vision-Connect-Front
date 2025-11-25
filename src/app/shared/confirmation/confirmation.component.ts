import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {ChangeDetectionStrategy, inject} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';


@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationComponent {

  title: string;
  content: string;
  yes: string;
  no: string;

  constructor(
    private dialogRef: MatDialogRef<ConfirmationComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) 
  {
    this.title = data.title;
    this.content = data.content;
    this.yes = data.yes;
    this.no = data.no;
  }

  ngOnInit() { }
  
  onClickYes() {
    this.dialogRef.close(true);
  }

  onClickNo() {
    this.dialogRef.close(false);
  }

  onClose() {
    this.dialogRef.close();
  }
}
