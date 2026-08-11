import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { CoachSubscriptionService } from '../../../core/services/coach-subscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminPendingCancellation } from '../../../core/models/admin-cancellation.model';

@Component({
  selector: 'fit-admin-cancellations',
  templateUrl: './cancellations.component.html',
  styleUrls: ['./cancellations.component.css'],
})
export class AdminCancellationsComponent implements OnInit {
  pending: AdminPendingCancellation[] = [];
  loading = false;
  errorMessage = '';
  actionLoading = '';

  constructor(
    private admin: AdminService,
    private subscriptions: CoachSubscriptionService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadCancellations();
  }

  loadCancellations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.admin.pendingCancellations().subscribe({
      next: (items) => { this.pending = items || []; this.loading = false; },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load cancellations'; this.loading = false; },
    });
  }

  approveCancel(sub: AdminPendingCancellation): void {
    this.actionLoading = sub.id;
    this.subscriptions.processCancel(sub.id).subscribe({
      next: () => {
        this.actionLoading = '';
        this.toast.success('Cancellation approved');
        this.pending = this.pending.filter((x) => x.id !== sub.id);
      },
      error: (err: { message?: string }) => {
        this.actionLoading = '';
        this.toast.error(err.message || 'Approve failed');
      },
    });
  }

  rejectCancel(sub: AdminPendingCancellation): void {
    this.actionLoading = sub.id;
    this.subscriptions.rejectCancel(sub.id).subscribe({
      next: () => {
        this.actionLoading = '';
        this.toast.success('Cancellation rejected');
        this.pending = this.pending.filter((x) => x.id !== sub.id);
      },
      error: (err: { message?: string }) => {
        this.actionLoading = '';
        this.toast.error(err.message || 'Reject failed');
      },
    });
  }
}
