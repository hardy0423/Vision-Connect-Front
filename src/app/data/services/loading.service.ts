import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  loadingSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private activeRequests: number = 0;
  private valueSource = new BehaviorSubject<string>('');
  currentValue = this.valueSource.asObservable();

  setLoading(isLoading: boolean): void {
    if (isLoading) {
      this.activeRequests++;
      this.loadingSubject.next(true);
    } else {
      this.activeRequests--;
      if (this.activeRequests <= 0) {
        this.activeRequests = 0;
        this.loadingSubject.next(false);
      }
    }
  }

  changeValue(value: string) {
    this.valueSource.next(value);
  }
}
