import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CoachSubscriptionService } from '../../../core/services/coach-subscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/services/api.service';
import { CoachSubscription } from '../../../core/models/coach-subscription.model';
import { CoachProfile } from '../../../core/models/user.model';

interface TraineeRef {
  _id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

@Component({
  selector: 'fit-coach-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class CoachDashboardComponent implements OnInit {
  trainees: CoachSubscription[] = [];
  loading = true;
  busyId = '';
  highlightPending = false;

  private pendingCancelFocus = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private coachSub: CoachSubscriptionService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('pendingCancel') === '1') {
        this.focusPendingCancellations();
      }
    });
    this.load();
  }

  private focusPendingCancellations(): void {
    if (this.loading || this.trainees.length === 0) {
      this.pendingCancelFocus = true;
      return;
    }
    this.scrollToCancellations();
  }

  private load(): void {
    this.coachSub.myTrainees().subscribe({
      next: (subs) => {
        this.trainees = subs;
        this.loading = false;
        if (this.pendingCancelFocus) {
          this.pendingCancelFocus = false;
          setTimeout(() => this.scrollToCancellations(), 150);
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get firstName(): string {
    return this.auth.currentUser?.firstName || '';
  }

  get coachProfile(): CoachProfile | undefined {
    return this.auth.currentUser?.coachProfile;
  }

  get stars(): number[] {
    const rating = this.coachProfile?.averageRating || 0;
    const max = 5;
    return Array.from({ length: max }, (_, i) => {
      const val = rating - i;
      if (val >= 1) return 1;
      if (val > 0) return 0.5;
      return 0;
    });
  }

  get totalTrainees(): number {
    return this.trainees.filter((t) => t.status === 'active').length;
  }

  get activeTrainees(): CoachSubscription[] {
    return this.trainees.filter((t) => t.status === 'active');
  }

  get pendingCancellations(): number {
    return this.trainees.filter((t) => t.cancellationRequest?.requested === true).length;
  }

  get pendingRequests(): CoachSubscription[] {
    return this.trainees.filter((t) => t.cancellationRequest?.requested === true);
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

  traineeAvatar(sub: CoachSubscription): string | undefined {
    const ref = sub.traineeId as unknown as TraineeRef;
    if (ref && typeof ref === 'object' && ref.avatar) {
      return ref.avatar;
    }
    return undefined;
  }

  traineeInitial(sub: CoachSubscription): string {
    const ref = sub.traineeId as unknown as TraineeRef;
    if (ref && typeof ref === 'object' && ref.firstName) {
      return ref.firstName.charAt(0).toUpperCase();
    }
    return '?';
  }

  packageName(sub: CoachSubscription): string {
    const pkg = sub.packageId as unknown as { name?: string } | undefined;
    if (pkg && typeof pkg === 'object' && pkg.name) {
      return pkg.name;
    }
    return '';
  }

  onPendingStatClick(): void {
    if (this.pendingCancellations > 0) {
      this.scrollToCancellations();
    } else {
      this.router.navigate(['/coach/trainees']);
    }
  }

  private scrollToCancellations(): void {
    const el = document.getElementById('pending-cancellations');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.highlightPending = true;
      setTimeout(() => {
        this.highlightPending = false;
      }, 2600);
    } else if (this.pendingCancellations === 0) {
      this.router.navigate(['/coach/trainees']);
    }
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
