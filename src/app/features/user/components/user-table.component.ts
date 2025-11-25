import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  inject,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import {
  UserInterface,
  UserWithCompanyDetailInterface,
} from '../../../data/interfaces/user.interface';
import { UserFormComponent } from '../../modal/user-form-fields/user-form.component';
import { UserService } from '../services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { SharedModule } from '../../../shared/shared.module';
import { ConfirmationComponent } from '../../../shared/confirmation/confirmation.component';
import {
  catchError,
  EMPTY,
  filter,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { ToastService } from 'angular-toastify';
import { ProfileComponent } from '../../profile/components/profile/profile.component';
import { ComponentType } from '@angular/cdk/portal';
import { MatSelectChange } from '@angular/material/select';
import { DeviceService } from '../../device/services/device.service';
import { CompanyInterface } from '../../../data/interfaces/company.interface';
import { AdminFormFieldsComponent } from '../../modal/admin-form-fields/admin-form-fields.component';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent,
} from '@angular/material/paginator';
import { getFrenchPaginatorIntl } from '../../../data/utils/translate';
@Component({
  selector: 'app-user-table',
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss'],
  imports: [CommonModule, MatTableModule, SharedModule],
  standalone: true,
  providers: [
    { provide: MatPaginatorIntl, useValue: getFrenchPaginatorIntl() },
  ],
})
export class UserTableComponent {
  // === Injected Services ===
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly userService = inject(UserService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly deviceService = inject(DeviceService);
  private readonly cdRef = inject(ChangeDetectorRef);

  // === ViewChild ===
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // === Table Configuration ===
  public displayedColumns = [
    {
      name: 'first_name',
      title: this.translate.instant('user.column_titles.first_name'),
      isDisplayed: false,
    },
    {
      name: 'last_name',
      title: this.translate.instant('user.column_titles.last_name'),
      isDisplayed: false,
    },
    {
      name: 'email',
      title: this.translate.instant('user.column_titles.email'),
      isDisplayed: false,
    },
    {
      name: 'is_active',
      title: this.translate.instant('user.column_titles.statut'),
      isDisplayed: false,
    },
  ];

  public columnNames = [
    ...this.displayedColumns.map((col) => col.name),
    'action',
  ];

  // === Data Source ===
  public dataSource: MatTableDataSource<UserInterface> =
    new MatTableDataSource<UserInterface>([]);

  // === Filtering & Pagination ===
  public filterValues: { [key: string]: string } = {};
  public limit = 10;
  public offset = 0;
  public totalCount = 0;

  // === Component State ===
  public idCompany: string | null = null;
  public userData!: UserInterface;
  public companyList?: CompanyInterface[];
  public isAdminOrSuperUser = false;
  public isAdminExist = false;
  public isLoading = true;

  // === Observables & Cleanup ===
  private readonly destroy$ = new Subject<void>();

  // === Lifecycle Hooks ===
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.idCompany = params.get('uid');
      this.loadUser();
      if (!this.idCompany) {
        this.displayedColumns.push({
          name: 'companies',
          title: this.translate.instant('user.column_titles.company'),
          isDisplayed: true,
        });
        this.columnNames = [
          ...this.displayedColumns.map((col) => col.name),
          'action',
        ];
      }
    });

    this.dataSource.filterPredicate = this.createFilter();

    this.userService
      .getUserInformation()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.userData = user;
        this.isAdminOrSuperUser = !!(user.is_superuser || user.is_admin);
      });

    this.deviceService
      .getCompanies()
      .pipe(takeUntil(this.destroy$))
      .subscribe((companies) => {
        this.companyList = companies;
      });

    this.userService
      .getSaveUserInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isSaved) => {
        if (isSaved) this.loadUser();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUser(): void {
    this.isLoading = true;
    this.userService
      .getListUserTable(this.idCompany, this.limit, this.offset)
      .pipe(
        tap((data) => {
          this.dataSource.data = data.results;
          this.totalCount = data.count;
          this.isAdminExist = data.results.some(
            (user: UserInterface) => user.is_admin
          );
          this.isLoading = false;
          this.cdRef.detectChanges();
        }),
        catchError((error) => {
          this.isLoading = false;
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  // Handle pagination change
  onPageChange(event: PageEvent): void {
    this.limit = event.pageSize;
    this.offset = event.pageIndex * this.limit;
    this.loadUser();
  }

  // Handle page navigation
  onNext(): void {
    if (this.offset + this.limit < this.totalCount) {
      this.offset += this.limit;
      this.loadUser();
    }
  }

  onPrevious(): void {
    if (this.offset - this.limit >= 0) {
      this.offset -= this.limit;
      this.loadUser();
    }
  }

  // Open modal for user form or profile based on conditions
  openModal(isAdd: boolean = true, user: UserInterface): void {
    if ((!this.companyList || this.companyList.length === 0) && isAdd) {
      this.toastService.warn(this.translate.instant('user.error.company_none'));
      return;
    }

    const isAdmin = user.is_admin || user.is_superuser;
    const component: ComponentType<any> =
      isAdd || !isAdmin ? UserFormComponent : ProfileComponent;
    const width = component === UserFormComponent ? '25%' : undefined;

    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '40%',
      data: { isAdd, user },
      hasBackdrop: true,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe();
  }

  // Delete or restore user
  deleteOrRestoreUser(
    user: UserWithCompanyDetailInterface,
    isDelete: boolean
  ): void {
    if (!user.companies || !user.companies.is_actif) {
      this.toastService.error(
        this.translate.instant('user.error.company_inactive')
      );
      return;
    }

    const data = {
      title: isDelete
        ? this.translate.instant('user.title_suppression')
        : this.translate.instant('user.title_activation'),
      content: isDelete
        ? this.translate.instant('user.delete_user')
        : this.translate.instant('user.activate_user'),
      yes: this.translate.instant('user.confirmation'),
      no: this.translate.instant('user.refus'),
    };

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      autoFocus: true,
      data,
    });

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((result) => {
          if (result) {
            const actionObservable = isDelete
              ? this.userService.deleteUser(user.uid)
              : this.userService.restoreUser(user.uid);

            return actionObservable.pipe(
              catchError((error) => {
                const errorMessage = isDelete
                  ? 'user.error.error_deleting_user'
                  : 'user.error.error_activating_user';
                this.toastService.error(this.translate.instant(errorMessage));
                return EMPTY;
              }),
              tap(() => {
                this.loadUser();
                const successMessage = isDelete
                  ? 'user.success_deleting_user'
                  : 'user.success_activating_user';
                this.toastService.success(
                  this.translate.instant(successMessage)
                );
              })
            );
          } else {
            return EMPTY;
          }
        })
      )
      .subscribe();
  }

  // Apply column-based filter
  applyFilter(event: Event, columnName: string): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.filterValues[columnName] = filterValue;
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  createFilter(): (data: UserInterface, filter: string) => boolean {
    return (data: UserInterface, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);

      return Object.keys(searchTerms).every((key) => {
        if (!searchTerms[key]) return true;

        if (key === 'companies') {
          const companyName =
            data.companies?.name?.toString().toLowerCase() || '';
          return companyName.includes(searchTerms[key].toLowerCase());
        }
        const value = data[key]?.toString().toLowerCase() || '';
        return value.includes(searchTerms[key].toLowerCase());
      });
    };
  }

  // Apply select-based filter
  applySelectFilter(event: MatSelectChange, columnName: string): void {
    const selectedValue = event.value;
    this.filterValues[columnName] =
      selectedValue === '' ? '' : selectedValue === 'true' ? 'true' : 'false';

    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  // Apply company-based filter
  applyCompanyFilter(event: MatSelectChange, columnName: string): void {
    this.filterValues[columnName] = event.value || '';
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  openModalAdministrator(isAdminExist: boolean): void {
    const dialogRef = this.dialog.open(AdminFormFieldsComponent, {
      data: {},
      hasBackdrop: true,
      disableClose: true,
      width: '40%',
    });

    dialogRef.afterClosed().subscribe();
  }
}
