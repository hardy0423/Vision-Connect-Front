import { MatPaginatorIntl } from "@angular/material/paginator";

export function getFrenchPaginatorIntl() {
    const paginatorIntl = new MatPaginatorIntl();
  
    paginatorIntl.itemsPerPageLabel = 'Éléments par page :';
    paginatorIntl.nextPageLabel = 'Page suivante';
    paginatorIntl.previousPageLabel = 'Page précédente';
    paginatorIntl.firstPageLabel = 'Première page';
    paginatorIntl.lastPageLabel = 'Dernière page';
    paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return `0 sur ${length}`;
      }
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} sur ${length}`;
    };
  
    return paginatorIntl;
  }