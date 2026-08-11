import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CoachService } from '../../../core/services/coach.service';
import { CoachSubscriptionService } from '../../../core/services/coach-subscription.service';
import { PackageService } from '../../../core/services/package.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ApiError } from '../../../core/services/api.service';
import { Package } from '../../../core/models/package.model';
import { User } from '../../../core/models/user.model';
import { CoachSubscription } from '../../../core/models/coach-subscription.model';

@Component({
  selector: 'fit-coach-subscription',
  templateUrl: './coach-subscription.component.html',
  styleUrls: ['./coach-subscription.component.css'],
})
export class CoachSubscriptionComponent implements OnInit {
  coaches: User[] = [];
  packages: Package[] = [];
  active: CoachSubscription | null = null;
  selectedCoach: User | null = null;
  loading = true;
  errorMessage = '';
  processing = false;
  paying = false;
  conflictBlocked = false;

  private readonly specOptions: Record<string, string> = {};

  constructor(
    private coachService: CoachService,
    private coachSubService: CoachSubscriptionService,
    private packageService: PackageService,
    private toast: ToastService,
    private auth: AuthService,
    private payment: PaymentService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const coachId = this.route.snapshot.queryParamMap.get('coachId');
    this.coachSubService.mine().subscribe({
      next: (mine) => {
        this.active = mine;
        this.coachService.list({ limit: 100 }).subscribe({
          next: (coaches) => {
            this.coaches = coaches;
            this.loading = false;
            if (coachId) {
              const found = coaches.find((c) => c._id === coachId);
              if (found) this.selectCoach(found);
            }
          },
          error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load coaches'; this.loading = false; },
        });
      },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load subscription'; this.loading = false; },
    });
  }

  get blocked(): boolean {
    return (
      this.conflictBlocked ||
      (!!this.active &&
        (this.active.status === 'active' || this.active.status === 'pending'))
    );
  }

  selectCoach(coach: User): void {
    this.selectedCoach = coach;
    this.errorMessage = '';
    this.packageService.list().subscribe({
      next: (pkgs) => { this.packages = pkgs.filter((p) => p.type === 'coach'); },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load plans'; },
    });
  }

  backToList(): void { this.selectedCoach = null; this.packages = []; }

  payNow(): void {
    if (!this.active || this.paying) return;
    this.paying = true;
    this.payment.initiate(this.active._id, 'coach').subscribe({
      next: (res) => {
        if (!res.checkoutUrl) {
          this.paying = false;
          this.toast.error('Unable to start payment. Please try again.');
          return;
        }
        window.location.href = res.checkoutUrl;
      },
      error: () => {
        this.paying = false;
        this.toast.error('Unable to start payment. Please try again.');
      },
    });
  }

  subscribe(pkg: Package): void {
    if (!this.selectedCoach || this.processing) return;
    this.processing = true;
    this.coachSubService.subscribe(this.selectedCoach._id, pkg._id).subscribe({
      next: () => { this.processing = false; this.toast.success('Subscribed — complete payment to activate'); this.router.navigate(['/trainee']); },
      error: (err: ApiError) => {
        this.processing = false;
        if (err?.status === 409) {
          this.conflictBlocked = true;
          this.errorMessage = 'You already have an active coach subscription.';
        } else {
          this.errorMessage = err.message || 'Subscription failed';
        }
      },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}