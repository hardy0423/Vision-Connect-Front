import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [ MatStepperModule,MatButtonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent implements OnInit {

  @Input() text = '';
  @Input() bgColor = 'white';
  @Input() borderRadius = '8px';
  @Input() fontSize = '';
  @Input() value = '';
  @Input() padding = '0.5rem 1rem';
  @Input() disabled = false;
  @Input() textColor = '#7985da';
  @Input() stepperNext: string | null = null;
  @Input() stepperPrevious: string | null = null;

  constructor() { }

  ngOnInit() {
  }

}