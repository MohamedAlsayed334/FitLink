import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  private dismissSubject = new Subject<number>();
  private clearSubject = new Subject<void>();
  private nextId = 1;

  toast$ = this.toastSubject.asObservable();
  dismissed$ = this.dismissSubject.asObservable();
  cleared$ = this.clearSubject.asObservable();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  dismiss(id: number): void {
    this.dismissSubject.next(id);
  }

  clear(): void {
    this.clearSubject.next();
  }

  private show(type: ToastMessage['type'], message: string): void {
    this.toastSubject.next({ id: this.nextId++, type, message });
  }
}