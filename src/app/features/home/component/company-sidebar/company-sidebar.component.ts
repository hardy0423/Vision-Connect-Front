import { Component, Inject, Input, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedModule } from '../../../../shared/shared.module';
import { MenuItem } from '../../../../data/interfaces/menu.interface';
import { CompanyInterface } from '../../../../data/interfaces/company.interface';
import { environment } from '../../../../../environment/environment';




@Component({
  selector: 'company-sidebar',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './company-sidebar.component.html',
  styleUrl: './company-sidebar.component.scss'
})
export class MenuComponent{
  @Input() menuItems: MenuItem[] = [];
  @Input() company!: CompanyInterface; 
    APIURL = environment.apiUrl;

}
