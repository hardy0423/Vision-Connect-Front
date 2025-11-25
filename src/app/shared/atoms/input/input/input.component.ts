import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent implements OnInit {

  @Input() placeholder = '';
  @Input() width = '100%';
  @Input() type = 'text';
  @Input() formName!: FormControl;
  constructor() { }

  ngOnInit() {
  }

}