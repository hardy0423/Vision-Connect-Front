import { CommonModule } from '@angular/common';
import { Component, Inject, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CompanyInterface } from '../../../data/interfaces/company.interface';
import { CompanyFormComponent } from '../../modal/company-form-fields/company-form.component';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationComponent } from '../../../shared/confirmation/confirmation.component';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  Observable,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { CompanyService } from '../services/company.service';
import { SharedModule } from '../../../shared/shared.module';
import { UserService } from '../../user/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from 'angular-toastify';
import {
  MatPaginator,
  MatPaginatorIntl,
  PageEvent,
} from '@angular/material/paginator';
import { MatSelectChange } from '@angular/material/select';
import {
  User,
  UserInterface,
  UserWithCompanyDetailInterface,
} from '../../../data/interfaces/user.interface';
import { ImageComponent } from './image/image.component';
import { environment } from '../../../../environment/environment';
import { getFrenchPaginatorIntl } from '../../../data/utils/translate';
import { TotalDeviceComponent } from './total-device/total-device.component';

@Component({
  selector: 'app-company-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, SharedModule],
  templateUrl: './company-table.component.html',
  styleUrls: ['./company-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getFrenchPaginatorIntl() },
  ],
})
export class CompanyTableComponent implements OnDestroy {
  // === Environment / Constants ===
  public APIURL = environment.apiUrl;

  // === Injected Services ===
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly companyService = inject(CompanyService);
  private readonly toastService = inject(ToastService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  public companyStatus: 'active' | 'inactive' = 'active';

  // === ViewChild ===
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // === Table Configuration ===
  public displayedColumns = [
    { name: 'name', title: 'Nom' },
    { name: 'email', title: 'Email' },
    { name: 'region', title: 'Région' },
    { name: 'adress', title: 'Adresse' },
    { name: 'country', title: 'Pays' },
    { name: 'nbr_device', title: "Nombre d'appareil" },
  ];
  public columnNames = [
    ...this.displayedColumns.map((col) => col.name),
    'action',
  ];
  public dataSource = new MatTableDataSource<CompanyInterface>([]);

  // === Observables & Subjects ===
  private readonly companiesSubject = new BehaviorSubject<CompanyInterface[]>(
    []
  );
  public companies$ = this.companiesSubject.asObservable();
  private readonly destroy$ = new Subject<void>();

  // === UI State ===
  public isLoading = false;
  public isImageModalOpen = false;
  public selectedImage: string | ArrayBuffer | null = null;

  // === Company State ===
  public companyInformation!: CompanyInterface;
  public companyDetailView?: CompanyInterface;
  public defaultCompanies?: CompanyInterface;
  public totalNbrDevices?: number;

  // === Filters & Pagination ===
  public filterValues: { [key: string]: string } = {};
  public filterActiveCompanies = false;
  public filterInactiveCompanies = false;
  public limit = 50;
  public offset = 0;
  public totalCount = 0;
  public idCompany: string | null = null;

  // === User State ===
  public userInformation?: UserWithCompanyDetailInterface;
  public isAdminOrSuperUser = false;
  public isVisionConnect = false;
  public isFmap = false;

  // === Component Lifecycle ===
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.idCompany = params.get('uid');
      this.loadCompanies();
    });

    this.userService
      .getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.userInformation = user;
        this.isAdminOrSuperUser = user.is_superuser || user.is_admin;
        this.isVisionConnect = user.is_admin;
        this.isFmap = user.is_superuser;
      });

    this.companies$.pipe(takeUntil(this.destroy$)).subscribe((companies) => {
      this.dataSource.data = companies;
    });

    this.companyService
      .getSaveCompanyInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isSaved: boolean | null) => {
        if (isSaved) {
          this.loadCompanies();
        }
      });

    this.dataSource.filterPredicate = this.createFilter();
    this.applyCompanyStatusFilter();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Helper Methods ===
  private loadCompanies(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.companyService
      .getListCompanyTable(this.idCompany, this.limit, this.offset)
      .pipe(
        tap((data) => {
          console.log('DATA:', data.results);

          this.totalNbrDevices = data.results
            .filter((company: any) => !company.default_company)
            .reduce((total, current) => total + current.nbr_device!, 0);

          const nonDefaultCompanies = data.results.filter(
            (company: any) => !company.default_company
          );

          const defaultCompanies = data.results.filter(
            (company: CompanyInterface) => company.default_company
          );

          this.defaultCompanies = defaultCompanies[0];
          this.companiesSubject.next(nonDefaultCompanies);
          this.totalCount = data.count;
          this.companyDetailView = data.results[0];
          this.isLoading = false;
        }),
        catchError((error) => {
          this.isLoading = false;
          this.toastService.error(
            this.translate.instant('company.error.loading')
          );
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  // === Modal Handling ===
  openModal(isAdd: boolean = true, companyInformation: CompanyInterface): void {
    const dialogRef = this.dialog.open(CompanyFormComponent, {
      width: '40%',
      data: { isAdd, companies: companyInformation },
      hasBackdrop: true,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(() => this.loadCompanies());
  }

  openModalUpdateNbrDevice() {
    const dialogRef = this.dialog.open(TotalDeviceComponent, {
      width: '30%',
      data: {},
      hasBackdrop: true,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((updated) => {
      if (updated) {
        //delete this
        this.loadCompanies();
      }
    });
  }

  // === Pagination ===
  onPageChange(event: PageEvent): void {
    this.limit = event.pageSize;
    this.offset = event.pageIndex * event.pageSize;
    this.loadCompanies();
  }

  // === Deletion and Restoration ===
  deleteCompany(company: CompanyInterface): void {
    this.confirmAction(
      'company.title_suppression',
      'company.delete_company',
      () => this.companyService.deleteCompany(company.uid),
      'deleted'
    );
  }

  restoreCompany(company: CompanyInterface): void {
    this.confirmAction(
      'company.title_restoration',
      'company.restoration_company',
      () => this.companyService.restoreCompany(company.uid),
      'restored'
    );
  }

  private confirmAction(
    titleKey: string,
    contentKey: string,
    action: () => Observable<any>,
    actionType: 'deleted' | 'restored'
  ): void {
    const data = {
      title: this.translate.instant(titleKey),
      content: this.translate.instant(contentKey),
      yes: this.translate.instant('company.confirmation'),
      no: this.translate.instant('company.refus'),
    };

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      disableClose: true,
      autoFocus: true,
      data: data,
    });

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((result) => {
          if (result === true) {
            return action().pipe(
              catchError((error) => {
                if (actionType === 'deleted') {
                  this.toastService.error(
                    this.translate.instant(
                      'company.error.error_deleting_company'
                    )
                  );
                } else if (actionType === 'restored') {
                  this.toastService.error(
                    this.translate.instant(
                      'company.error.error_restore_company'
                    )
                  );
                }

                return EMPTY;
              }),
              tap(() => {
                this.companyService.setSaveCompanyInfo(true);
                this.loadCompanies();

                if (actionType === 'deleted') {
                  this.toastService.success(
                    this.translate.instant('company.success.company_deleted')
                  );
                } else if (actionType === 'restored') {
                  this.toastService.success(
                    this.translate.instant('company.success.company_restored')
                  );
                }
              })
            );
          } else {
            return EMPTY;
          }
        })
      )
      .subscribe();
  }

  // === Filtering ===
  applyFilter(event: Event, columnName: string): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    console.log('FILTER VALUE:', filterValue);

    this.filterValues[columnName] = filterValue;
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  createFilter(): (data: CompanyInterface, filter: string) => boolean {
    return (data: CompanyInterface, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);

      return Object.keys(searchTerms).every((key) => {
        if (!searchTerms[key]) return true;
        let value = '';
        if (key === 'country') {
          value = data.country?.name?.toLowerCase() || '';
        } else {
          value = data[key]?.toString().toLowerCase() || '';
        }
        return value.includes(searchTerms[key].toLowerCase());
      });
    };
  }

  applySelectFilter(event: MatSelectChange, columnName: string): void {
    const selectedValue = event.value;
    this.filterValues[columnName] = selectedValue === '' ? '' : selectedValue;
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  applyCompanyStatusFilter(): void {
    this.filterValues['is_actif'] =
      this.companyStatus === 'active' ? 'true' : 'false';
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }

  openImageModal() {
    const dialogRef = this.dialog.open(ImageComponent, {
      disableClose: true,
      autoFocus: true,
      data: '',
      position: { top: '10%' },
    });

    dialogRef.afterClosed().subscribe(() => this.loadCompanies());
  }
}
