import { Component, inject, OnInit } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { MatDialogRef } from '@angular/material/dialog';
import { CompanyService } from '../../services/company.service';
import { catchError, map, throwError } from 'rxjs';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

/**
 * Component for handling the image upload process for a company logo.
 */
@Component({
  imports: [SharedModule],
  standalone: true,
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.scss'],
})
export class ImageComponent implements OnInit {
  // Injecting necessary services
  private companyService = inject(CompanyService);
  private route = inject(ActivatedRoute);

  // The currently selected image to be uploaded
  selectedImage: string | ArrayBuffer | null = null;

  // Parameter to store company UID from the route
  protected paramsUrl: string = '';

  /**
   * Constructor to initialize the dialog reference
   * @param dialogRef - Reference to the MatDialog to control the modal
   */
  constructor(private readonly dialogRef: MatDialogRef<ImageComponent>) {}

  /**
   * ngOnInit lifecycle hook
   * Retrieves the 'uid' parameter from the URL to identify the company
   */
  ngOnInit(): void {
    const primary = this.route.snapshot.root;
    const lastChild = this.getLastChild(primary);
    this.paramsUrl = lastChild.params['uid'];
  }

  /**
   * Closes the image modal and clears the selected image
   */
  closeImageModal(): void {
    this.dialogRef.close();
    this.selectedImage = null;
  }

  /**
   * Handles the file input change event, reads the selected image, and sets it as the selected image
   * @param event - The change event triggered by file input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage = e.target?.result!;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Saves the selected image by calling the company service
   * If no image is selected, logs a warning and closes the modal
   */
  saveImage(): void {
    if (this.selectedImage) {
      this.companyService
        .saveLogoCompany(this.selectedImage, this.paramsUrl)
        .subscribe({
          next: (response) => {
            this.companyService.setSaveCompanyInfo(true);
            this.dialogRef.close(response);
          },
          error: (error) => {
            console.error('Error while saving the image:', error);
          },
        });
    } else {
      console.warn('No image selected.');
      this.dialogRef.close();
    }
  }

  /**
   * Recursively finds the last child route from the current route
   * @param route - The route to start searching from
   * @returns The last child route snapshot
   */
  private getLastChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let child = route;
    while (child.firstChild) {
      child = child.firstChild;
    }
    return child;
  }
}