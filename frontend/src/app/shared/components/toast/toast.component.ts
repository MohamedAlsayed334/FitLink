import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ToastMessage, ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'fit-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];

  private destroy$ = new Subject<void>();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toast$
      .pipe(takeUntil(this.destroy$))
      .subscribe((toast) => {
        this.toasts.push(toast);
        setTimeout(() => this.remove(toast.id), toast.type === 'error' ? 6000 : 4000);
      });

    this.toastService.dismissed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => this.remove(id));

    this.toastService.cleared$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.toasts = [];
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dismissToast(id: number): void {
    this.toastService.dismiss(id);
  }

  private remove(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}