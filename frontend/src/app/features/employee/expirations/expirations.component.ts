import { Component, OnInit } from '@angular/core';
import { GymSubscriptionService } from '../../../core/services/gym-subscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { GymSubscription } from '../../../core/models/gym-subscription.model';
import { StatusTone } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'fit-expirations',
  templateUrl: './expirations.component.html',
  styleUrls: ['./expirations.component.css'],
})
export class ExpirationsComponent implements OnInit {
  expiring: GymSubscription[] = [];
  loading = true;
  errorMessage = '';
  actionLoading = '';

  constructor(
    private gymSubService: GymSubscriptionService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.gymSubService.list({ status: 'active', limit: 200 }).subscribe({
      next: (res) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        horizon.setHours(23, 59, 59, 999);
        this.expiring = (res.subscriptions || []).filter((s) => {
          const end = new Date(s.endDate);
          return end >= now && end <= horizon;
        });
        this.loading = false;
      },
      error: (err: { message?: string }) => {
        this.errorMessage = err.message || 'Failed to load expirations';
        this.loading = false;
      },
    });
  }

  traineeName(sub: GymSubscription): string {
    const t = sub.traineeId as unknown as { firstName?: string; lastName?: string };
    if (!t) return '—';
    return `${t.firstName || ''} ${t.lastName || ''}`.trim() || '—';
  }

  packageName(sub: GymSubscription): string {
    const p = sub.packageId as unknown as { name?: string };
    if (typeof p === 'object' && p?.name) return p.name;
    return '—';
  }

  daysLeft(sub: GymSubscription): number {
    const end = new Date(sub.endDate).getTime();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((end - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  daysTone(days: number): StatusTone {
    if (days <= 3) return 'danger';
    if (days <= 14) return 'warning';
    return 'success';
  }

  renew(sub: GymSubscription): void {
    this.actionLoading = sub._id;
    this.gymSubService.renew(sub._id).subscribe({
      next: () => {
        this.actionLoading = '';
        this.toast.success('Plan renewed');
        this.load();
      },
      error: (err: { message?: string }) => {
        this.actionLoading = '';
        this.toast.error(err.message || 'Renewal failed');
      },
    });
  }
}
