import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../features/user/services/user.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  isOpen = true;
  submenuOpen = false;

  menus = [
    // { title: 'Accueil', icon: 'home', route: 'home' },
    {
      title: 'Futurmap',
      icon: 'map',
      total: '25/50',
      submenu: true,
      isSubmenuOpen: false,
      devices: [
        { title: 'Appareil', icon: 'car' },
        { title: 'Rapport', icon: 'report' },
      ],
    },
    {
      title: 'Vision Connect',
      icon: 'map',
      submenu: true,
      total: '2/50',
      isSubmenuOpen: false,
      devices: [
        { title: 'Appareil', icon: 'car' },
        { title: 'Rapport', icon: 'report' },
      ],
    },
    {
      title: 'Undermap',
      icon: 'map',
      submenu: true,
      total: '5/50',
      isSubmenuOpen: false,
      devices: [
        { title: 'Appareil', icon: 'car' },
        { title: 'Rapport', icon: 'report' },
      ],
    },
    {
      title: 'Administration',
      icon: 'users',
      spacing: true,
      route: '/administation',
    },
  ];

  private userService = inject(UserService);

  ngOnInit(): void {

  }

  openSidebar() {
    this.isOpen = !this.isOpen;
  }

  toggleSubmenu(item: any) {
    item.isSubmenuOpen = !item.isSubmenuOpen;
  }
}
