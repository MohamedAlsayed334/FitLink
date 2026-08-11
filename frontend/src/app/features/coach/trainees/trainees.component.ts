import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CoachSubscriptionService } from '../../../core/services/coach-subscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/services/api.service';
import { CoachSubscription } from '../../../core/models/coach-subscription.model';

interface TraineeRef {
  _id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
}

@Component({
  selector: 'fit-coach-trainees',
  templateUrl: './trainees.component.html',
  styleUrls: ['./trainees.component.css'],
})
export class CoachTraineesComponent implements OnInit {
  trainees: CoachSubscription[] = [];
  loading = true;
  busyId = '';

  constructor(
    private coachSub: CoachSubscriptionService,
    private toast: ToastService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.coachSub.myTrainees().subscribe({
      next: (subs) => {
        this.trainees = subs;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  traineeName(sub: CoachSubscription): string {
    const ref = sub.traineeId as unknown as TraineeRef;
    if (ref && typeof ref === 'object' && ref.firstName) {
      return `${ref.firstName} ${ref.lastName || ''}`.trim();
    }
    return '';
  }

  traineeId(sub: CoachSubscription): string {
    const ref = sub.traineeId as unknown as TraineeRef;
    if (ref && typeof ref === 'object' && ref._id) {
      return ref._id;
    }
    return sub.traineeId || '';
  }

  toneFor(status: string): 'success' | 'neutral' | 'danger' {
    if (status === 'active') return 'success';
    if (status === 'cancelled') return 'danger';
    return 'neutral';
  }

  approve(sub: CoachSubscription): void {
    this.busyId = sub._id;
    this.coachSub.processCancel(sub._id).subscribe({
      next: () => {
        this.busyId = '';
        this.toast.success('Cancellation approved');
        this.load();
      },
      error: (err: ApiError) => {
        this.busyId = '';
        this.toast.error(err?.message || 'Could not approve cancellation');
      },
    });
  }

  reject(sub: CoachSubscription): void {
    this.busyId = sub._id;
    this.coachSub.rejectCancel(sub._id).subscribe({
      next: () => {
        this.busyId = '';
        this.toast.success('Cancellation rejected');
        this.load();
      },
      error: (err: ApiError) => {
        this.busyId = '';
        this.toast.error(err?.message || 'Could not reject cancellation');
      },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}