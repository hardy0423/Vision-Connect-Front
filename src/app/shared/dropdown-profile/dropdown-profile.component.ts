import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../core/auth/services/admin.service';

@Component({
  selector: 'app-dropdown-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-profile.component.html',
  styleUrl: './dropdown-profile.component.scss',
})
export class DropdownProfileComponent {
  isOpen = false;
  confirmationDialogVisible = false;
  private adminService = inject(AdminService);
  private router = inject(Router);

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  showConfirmationDialog() {
    this.confirmationDialogVisible = true;
  }

  handleConfirm() {
    this.confirmationDialogVisible = false;
    this.adminService.logout().subscribe({
      next: (response) => {
        this.router.navigate(['auth/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
      },
      complete: () => {
        console.log('Logout complete');
      },
    });
  }

  handleCancel() {
    this.confirmationDialogVisible = false;
  }
}
