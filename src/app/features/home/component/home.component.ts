import {
  ChangeDetectorRef,
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  Subscription,
  tap,
  throwError,
} from 'rxjs';
import { ConfirmationComponent } from '../../../shared/modal-confirmation/confirmation.component';
import { AdminService } from '../../../core/auth/services/admin.service';
import { SharedModule } from '../../../shared/shared.module';
import { MenuItem } from '../../../data/interfaces/menu.interface';
import { CompanyService } from '../../company/services/company.service';
import { CompanyInterface } from '../../../data/interfaces/company.interface';
import { UserService } from '../../user/services/user.service';
import { MatTableDataSource } from '@angular/material/table';
import { UserInterface } from '../../../data/interfaces/user.interface';
import { NotificationComponent } from '../../notification/components/notification.component';
import { NotificationService } from '../../notification/services/notification.service';
import { Notification } from '../../notification/models/notification.models';
import { MatDialog } from '@angular/material/dialog';
import { ProfileComponent } from '../../profile/components/profile/profile.component';
import { MenuComponent } from './company-sidebar/company-sidebar.component';

@Component({
  selector: 'app-pages',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslateModule,
    RouterOutlet,
    ConfirmationComponent,
    MenuComponent,
    SharedModule,
    NotificationComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class ClientComponent implements OnInit, OnDestroy {
  // ========= État de l'interface utilisateur =========
  public isOpen = true;
  public submenuOpen = false;
  public isOpenOption = false;
  public confirmationDialogVisible = false;
  public inRouter = false;
  public isAdminOrSuperUser = false;
  public idCompany: string | null = null;
  public isNotificationRead = false;
  public unreadNotificationsCount = 0;
  public mailUser = '';
  public searchTerm: string = '';
  filteredCompanies: CompanyInterface[] = [];

  // ========= Données Utilisateur et Entreprise =========
  public userInformation!: UserInterface;
  public companyList!: CompanyInterface[];
  public notifications: Notification[] = [];

  // ========= Abonnement =========
  private routeSub?: Subscription;
  public dataSource: MatTableDataSource<CompanyInterface> =
    new MatTableDataSource<CompanyInterface>([]);
  public notificationsRead = new Set<string>();

  // ========= Variables de pagination =========
  public limit = 10;
  public offset = 0;
  public totalCount = 0;

  // ========= Services injectés =========
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly companyService = inject(CompanyService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly notificationsService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  // ========= Observables et BehaviorSubjects =========
  private readonly companiesSubject = new BehaviorSubject<CompanyInterface[]>(
    []
  );
  public companies$ = this.companiesSubject.asObservable();

  // ========= État de chargement =========
  public isLoading = false;

  menu: MenuItem[] = [
    {
      icon: `M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z`,
      label: 'Futurmap',
      children: [
        {
          icon: `M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z`,
          label: 'Appareils',
          link: '/device',
        },
        {
          icon: `M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z`,
          label: 'Rapport',
          link: '/rapport',
        },
        {
          icon: `M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1h6z`,
          label: 'Notifications',
          link: '/notifications',
        },
        {
          icon: `M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z`,
          label: 'Administration',
          link: '/administration',
        },
      ],
    },
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.idCompany = params.get('uid');
      this.loadCompany();
    });

    this.checkActiveRoute(this.router.url);
    this.routeSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkActiveRoute(event.urlAfterRedirects);
      }
    });

    this.companyService
      .getSaveCompanyInfo()
      .subscribe((isSaved: boolean | null) => {
        if (isSaved) {
          this.loadCompany();
        }
      });

    this.userService.getUser().subscribe((user) => {
      this.mailUser = user.email;
      if (user.is_superuser || user.is_admin) {
        this.isAdminOrSuperUser = true;
      }
    });

    this.notificationsService.getNotifications().subscribe((notifications) => {
      this.notifications = notifications;
      this.updateUnreadCount();
    });

    this.companies$.subscribe((companies) => {
      this.companyList = companies.filter(
        (company) => !company.default_company
      );
      this.filterCompanies();
    });
  }

  private checkActiveRoute(url: string) {
    this.inRouter = url === '/';
    this.cdr.detectChanges();
  }

  loadCompany(): void {
    if (this.isLoading) return;

    this.isLoading = true;

    this.companyService
      .getListCompanyTable(this.idCompany, this.limit, this.offset)
      .pipe(
        tap((data) => {
          this.companiesSubject.next(data.results);
          this.totalCount = data.count;
          this.isLoading = false;
        }),
        catchError((error) => {
          this.isLoading = false;
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  openSidebar() {
    this.isOpen = !this.isOpen;
  }

  toggleSubmenu(item: any) {
    item.isSubmenuOpen = !item.isSubmenuOpen;
  }

  toggleDropdown() {
    this.isOpenOption = !this.isOpenOption;
  }

  handleConfirm() {
    this.confirmationDialogVisible = false;
    this.adminService.logout().subscribe({
      next: (response) => {
        this.router.navigateByUrl('/auth/login', { replaceUrl: true });
      },
      error: (error) => {
        console.error('Logout failed:', error);
      },
      complete: () => {
        console.log('Logout complete');
      },
    });
  }

  showConfirmationDialog() {
    this.confirmationDialogVisible = true;
  }

  handleCancel() {
    this.confirmationDialogVisible = false;
  }

  updateUnreadCount() {
    this.unreadNotificationsCount = this.notifications.filter(
      (n) => !n.read
    ).length;
  }

  openUserProfile() {
    const dialogRef = this.dialog.open(ProfileComponent, {
      data: {},
      hasBackdrop: true,
      disableClose: true,
      width: '40%',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Device modal closed with result:', result);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const dropdown = document.querySelector('.dropdown-content');
    if (dropdown && !dropdown.contains(event.target as Node)) {
      this.isOpenOption = false;
    }
  }

  filterCompanies() {
    this.filteredCompanies = this.companyList.filter((company) => {
      return company.name.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
  }

  repeatArray(n: number): number[] {
    return Array(n).fill(0).map((_, i) => i);
  }
}
