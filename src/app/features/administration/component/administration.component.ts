import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { CompanyTableComponent } from '../../company/components/company-table.component';
import { SharedModule } from '../../../shared/shared.module';
import { UserTableComponent } from '../../user/components/user-table.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceService } from '../../device/services/device.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [
    CommonModule,
    UserTableComponent,
    CompanyTableComponent,
    SharedModule,
  ],
  templateUrl: './administration.component.html',
  styleUrl: './administration.component.scss',
})
export class AdministrationComponent implements OnInit {
  public activeTab: string = 'UTILISATEURS';
  public idCompany: string | null = null;
  private readonly route = inject(ActivatedRoute);
  private readonly deviceService = inject(DeviceService);
  private router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.idCompany = params.get('uid');
      if (!this.idCompany) return;
      this.deviceService
        .getCompaniesById(this.idCompany)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (company) => {
            if (!company) {
              this.router.navigate(['/not-found']);
            }
          },
          error: () => {
            this.router.navigate(['/not-found']);
          },
        });
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }
}
