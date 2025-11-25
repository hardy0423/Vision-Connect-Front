import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  isSidebarShown: any;

  toggleSidebar() {
    throw new Error('Method not implemented.');
  }
  @ViewChild('navbar', { static: true }) navbar: ElementRef | undefined;
  navbarHeight: number = 0;

  ngAfterViewInit() {
    this.navbarHeight = this.navbar?.nativeElement.clientHeight;
  }
}
