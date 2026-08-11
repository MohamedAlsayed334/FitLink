import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PackageService } from '../../../core/services/package.service';
import { GymSubscriptionService } from '../../../core/services/gym-subscription.service';
import { ToastService } from '../../../core/services/toast.service';
import { Package } from '../../../core/models/package.model';
import { GymSubscription } from '../../../core/models/gym-subscription.model';

@Component({
  selector: 'fit-gym-subscription',
  templateUrl: './gym-subscription.component.html',
  styleUrls: ['./gym-subscription.component.css'],
})
export class GymSubscriptionComponent implements OnInit {
  packages: Package[] = [];
  gymSubs: GymSubscription[] = [];
  blocked = false;
  loading = true;
  errorMessage = '';
  selected: Package | null = null;
  processing = false;

  constructor(
    private packageService: PackageService,
    private gymSubService: GymSubscriptionService,
    private toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.packageService.list().subscribe({
      next: (pkgs) => { this.packages = pkgs.filter((p) => p.type === 'gym'); this.loading = false; },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load plans'; this.loading = false; },
    });
    this.gymSubService.mine().subscribe({
      next: (subs) => {
        this.gymSubs = subs;
        this.blocked = subs.some((s) => s.status === 'active' || s.status === 'pending');
      },
      error: (err: { message?: string }) => {
        this.errorMessage = err.message || 'Failed to load subscription';
      },
    });
  }

  choose(pkg: Package): void { this.selected = pkg; this.errorMessage = ''; }

  back(): void { this.selected = null; }

  confirm(): void {
    if (!this.selected) return;
    this.processing = true;
    this.gymSubService.subscribe(this.selected._id).subscribe({
      next: () => { this.processing = false; this.toast.success('Plan created — complete payment to activate'); this.router.navigate(['/trainee']); },
      error: (err: { message?: string }) => { this.processing = false; this.errorMessage = err.message || 'Subscription failed'; },
    });
  }
}