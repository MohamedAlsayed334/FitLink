import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { GymSubscriptionService } from '../../../core/services/gym-subscription.service';
import { CoachSubscriptionService } from '../../../core/services/coach-subscription.service';
import { PackageService } from '../../../core/services/package.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentService } from '../../../core/services/payment.service';
import {
  GymSubscription,
  SubscriptionHistoryEntry,
} from '../../../core/models/gym-subscription.model';
import {
  CoachSubscription,
  PopulatedCoach,
} from '../../../core/models/coach-subscription.model';
import { Package } from '../../../core/models/package.model';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Component({
  selector: 'fit-trainee-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class TraineeDashboardComponent implements OnInit {
  gymSubs: GymSubscription[] = [];
  coachSub: CoachSubscription | null = null;
  packages: Package[] = [];
  loading = true;
  errorMessage = '';
  cancelReason = '';
  showingCancelForm = false;
  payingGym = false;
  payingCoach = false;
  renewing = false;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private gymSubService: GymSubscriptionService,
    private coachSubService: CoachSubscriptionService,
    private packageService: PackageService,
    private toast: ToastService,
    private payment: PaymentService,
  ) {}

  ngOnInit(): void {
    this.load();
    if (this.route.snapshot.queryParamMap.get('cancelCoach') === '1') {
      this.showingCancelForm = true;
    }
  }

  private load(): void {
    this.loading = true;
    this.errorMessage = '';
    const packages$ = this.packageService.list();
    const gym$ = this.gymSubService.mine();
    const coach$ = this.coachSubService.mine();
    forkJoin({ packages: packages$, gymSubs: gym$, coachSub: coach$ }).subscribe({
      next: (res) => {
        this.packages = res.packages;
        this.gymSubs = res.gymSubs;
        this.coachSub = res.coachSub;
        this.loading = false;
        this.renewing = false;
      },
      error: (err: { message?: string }) => {
        this.errorMessage = err.message || 'Failed to load dashboard';
        this.loading = false;
        this.renewing = false;
      },
    });
  }

  get firstName(): string {
    return this.auth.currentUser?.firstName || '';
  }

  /* ── Gym membership ─────────────────────────────────────────── */

  /** Only PAID active subs count as active; an unpaid/pending sub is not. */
  get activeGym(): GymSubscription | undefined {
    return this.gymSubs.find(
      (s) => s.status === 'active' && s.paymentStatus === 'paid',
    );
  }

  get pendingGym(): GymSubscription | undefined {
    return this.gymSubs.find((s) => s.status === 'pending');
  }

  get currentGym(): GymSubscription | undefined {
    return (
      this.activeGym ??
      this.pendingGym ??
      this.gymSubs.find((s) => this.isExpired(s))
    );
  }

  private isExpired(s: GymSubscription): boolean {
    return (
      s.status === 'expired' ||
      (!!s.endDate && new Date(s.endDate).getTime() < Date.now())
    );
  }

  /** Resolves the package display name from a possibly-populated packageId. */
  packageName(pkgId: string | { _id?: string; name?: string }): string {
    if (pkgId && typeof pkgId === 'object' && pkgId.name) {
      return pkgId.name;
    }
    const id = typeof pkgId === 'string' ? pkgId : pkgId?._id;
    const found = this.packages.find((p) => p._id === id);
    return found ? found.name : 'Membership';
  }

  get gymPackageName(): string {
    const act = this.currentGym;
    if (!act) return '';
    return this.packageName(
      act.packageId as unknown as string | { _id?: string; name?: string },
    );
  }

  gymStatus(): 'active' | 'pending' | 'expired' | 'cancelled' | 'none' {
    if (this.activeGym) return 'active';
    if (this.pendingGym) return 'pending';
    if (this.gymSubs.some((s) => this.isExpired(s))) return 'expired';
    const cancelled = this.gymSubs.some((s) => s.status === 'cancelled');
    return cancelled ? 'cancelled' : 'none';
  }

  /** Days until the gym plan expires (0 when already expired/ended). */
  get gymDaysRemaining(): number {
    const act = this.currentGym;
    if (!act?.endDate) return 0;
    const diff = Math.ceil(
      (new Date(act.endDate).getTime() - Date.now()) / MS_PER_DAY,
    );
    return Math.max(0, diff);
  }

  get gymRenewalDate(): Date | null {
    const act = this.currentGym;
    if (!act?.endDate) return null;
    return new Date(act.endDate);
  }

  /** Whether the current gym plan can be renewed right now.
   *  Mirrors the backend rule: renew allowed only when the sub is already
   *  cancelled/expired, or within RENEW_WINDOW_DAYS (7) of its end date. */
  get canRenewGym(): boolean {
    const sub = this.currentGym;
    if (!sub) return false;
    if (sub.status === 'pending') return false; // must pay first
    if (sub.paymentStatus === 'pending') return false; // must pay first
    if (sub.status === 'cancelled') return true;        // re-subscribe
    if (sub.status === 'expired') return true;          // restart
    if (!sub.endDate) return false;
    const RENEW_WINDOW_DAYS = 7;
    const windowMs = RENEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    return new Date(sub.endDate).getTime() - Date.now() <= windowMs;
  }

  /** 0–100, how much of the current period has elapsed. */
  periodProgress(start?: string, end?: string): number {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (e <= s) return 100;
    const pct = ((Date.now() - s) / (e - s)) * 100;
    return Math.min(100, Math.max(0, Math.round(pct)));
  }

  get gymProgress(): number {
    const act = this.currentGym;
    return this.periodProgress(act?.startDate, act?.endDate);
  }

  /** Most recent ~8 activity events, newest first. */
  get gymHistory(): SubscriptionHistoryEntry[] {
    return (this.currentGym?.history ?? []).slice(-8).reverse();
  }

  /** Total number of activity events for the "showing last N" note. */
  get gymHistoryTotal(): number {
    return this.currentGym?.history?.length ?? 0;
  }

  /** Humanizes a raw history action string (unknown actions pass through). */
  historyLabel(action: string): string {
    const labels: Record<string, string> = {
      renewed: 'Renewed',
      cancel_requested: 'Cancellation requested',
      payment_confirmed: 'Payment confirmed',
      created: 'Plan created',
    };
    return labels[action] ?? action;
  }

  get coachProgress(): number {
    return this.periodProgress(this.coachSub?.startDate, this.coachSub?.endDate);
  }

  /* ── Coach subscription ─────────────────────────────────────── */

  /**
   * The populated coach document (backend always populates `coachId` on
   * GET /api/coach-subscriptions/mine). Falls back to null for a raw id or
   * when there is no subscription.
   */
  get coach(): PopulatedCoach | null {
    const raw = this.coachSub?.coachId;
    if (!raw || typeof raw === 'string') return null;
    return raw;
  }

  get coachName(): string {
    const c = this.coach;
    return c ? `${c.firstName} ${c.lastName}`.trim() : '';
  }

  get coachInitials(): string {
    const c = this.coach;
    if (!c) return '';
    return `${(c.firstName || '?').charAt(0)}${(c.lastName || '').charAt(0)}`.toUpperCase();
  }

  /** Raw coach id for deep links (/chat?with=<coachId>). */
  get coachIdForChat(): string | null {
    const raw = this.coachSub?.coachId;
    if (!raw) return null;
    return typeof raw === 'string' ? raw : raw._id;
  }

  /** Only a PAID ACTIVE coach sub unlocks paid benefits (messaging, rating). */
  get coachActive(): boolean {
    return (
      !!this.coachSub &&
      this.coachSub.status === 'active' &&
      this.coachSub.paymentStatus === 'paid'
    );
  }

  get coachPackageName(): string {
    if (!this.coachSub?.packageId) return 'Coaching';
    return this.packageName(this.coachSub.packageId);
  }

  get coachDaysRemaining(): number {
    if (!this.coachSub?.endDate) return 0;
    const diff = Math.ceil(
      (new Date(this.coachSub.endDate).getTime() - Date.now()) / MS_PER_DAY,
    );
    return Math.max(0, diff);
  }

  /* ── Hero subline ───────────────────────────────────────────── */

  get heroSubline(): string {
    const g = this.gymStatus();
    if (g === 'active' && this.gymRenewalDate) {
      return `Your membership runs until ${this.gymRenewalDate.toLocaleDateString()} — ${this.gymDaysRemaining} days to go.`;
    }
    if (g === 'pending') {
      return 'Your gym membership is awaiting payment — complete checkout to activate it.';
    }
    if (g === 'expired') {
      return 'Your membership has lapsed. Renew to keep training.';
    }
    if (g === 'cancelled') {
      return 'Your membership is cancelled. Choose a plan to get back in.';
    }
    return 'Pick a gym plan or subscribe to a coach to get started.';
  }

  /* ── Actions ────────────────────────────────────────────────── */

  payNowGym(): void {
    const act = this.currentGym;
    if (!act || this.payingGym) return;
    this.payingGym = true;
    this.payment.initiate(act._id, 'gym').subscribe({
      next: (res) => {
        if (!res.checkoutUrl) {
          this.payingGym = false;
          this.toast.error('Unable to start payment. Please try again.');
          return;
        }
        window.location.href = res.checkoutUrl;
      },
      error: () => {
        this.payingGym = false;
        this.toast.error('Unable to start payment. Please try again.');
      },
    });
  }

  payNowCoach(): void {
    if (!this.coachSub || this.payingCoach) return;
    this.payingCoach = true;
    this.payment.initiate(this.coachSub._id, 'coach').subscribe({
      next: (res) => {
        if (!res.checkoutUrl) {
          this.payingCoach = false;
          this.toast.error('Unable to start payment. Please try again.');
          return;
        }
        window.location.href = res.checkoutUrl;
      },
      error: () => {
        this.payingCoach = false;
        this.toast.error('Unable to start payment. Please try again.');
      },
    });
  }

  renew(): void {
    const act = this.currentGym;
    if (!act || this.renewing) return;
    if (act.paymentStatus === 'pending') {
      this.toast.error('Complete the outstanding payment first');
      return;
    }
    this.renewing = true;
    this.gymSubService.renew(act._id).subscribe({
      next: () => {
        this.toast.success('Renewal created — complete payment to activate');
        this.load();
      },
      error: (err: { message?: string }) => {
        this.renewing = false;
        this.toast.error(err.message || 'Renewal failed');
      },
    });
  }

  cancelGym(): void {
    const act = this.activeGym;
    if (!act) return;
    this.gymSubService.cancel(act._id).subscribe({
      next: () => {
        this.toast.success('Plan cancelled');
        this.load();
      },
      error: (err: { message?: string }) => {
        this.toast.error(err.message || 'Cancel failed');
      },
    });
  }

  toggleCancelForm(): void {
    this.showingCancelForm = !this.showingCancelForm;
    if (!this.showingCancelForm) this.cancelReason = '';
  }

  requestCoachCancel(): void {
    if (!this.coachSub) return;
    this.coachSubService
      .requestCancel(this.coachSub._id, this.cancelReason.trim() || undefined)
      .subscribe({
        next: () => {
          this.toast.success('Cancellation request sent');
          this.showingCancelForm = false;
          this.cancelReason = '';
          this.load();
        },
        error: (err: { message?: string }) => {
          this.toast.error(err.message || 'Request failed');
        },
      });
  }

  messageCoach(): void {
    if (!this.coachActive) {
      this.toast.error('Your coach subscription must be active and paid to message.');
      return;
    }
    const id = this.coachIdForChat;
    if (!id) return;
    void this.router.navigate(['/chat'], { queryParams: { with: id } });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
