import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee.service';
import { GymSubscriptionService } from '../../../core/services/gym-subscription.service';
import { PackageService } from '../../../core/services/package.service';
import { ToastService } from '../../../core/services/toast.service';
import { Package } from '../../../core/models/package.model';
import { StatusTone } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'fit-trainee-profile',
  templateUrl: './trainee-profile.component.html',
  styleUrls: ['./trainee-profile.component.css'],
})
export class TraineeProfileComponent implements OnInit {
  trainee: any = null;
  gymSubs: any[] = [];
  coachSubs: any[] = [];
  packages: Package[] = [];
  loading = true;
  errorMessage = '';
  selling = false;
  sellPackageId = '';
  actionLoading = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employee: EmployeeService,
    private gymSubService: GymSubscriptionService,
    private packageService: PackageService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    }
  }

  get initials(): string {
    const t = this.trainee;
    if (!t) return '';
    return `${(t.firstName || '')[0] || ''}${(t.lastName || '')[0] || ''}`.toUpperCase();
  }

  get gymPackages(): Package[] {
    return this.packages;
  }

  private load(id: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.employee.traineeProfile(id).subscribe({
      next: (res) => {
        this.trainee = res.trainee;
        this.gymSubs = res.gymSubscriptions || [];
        this.coachSubs = res.coachSubscriptions || [];
        this.loading = false;
      },
      error: (err: { message?: string }) => {
        this.errorMessage = err.message || 'Failed to load trainee profile';
        this.loading = false;
      },
    });
    this.packageService.list().subscribe({
      next: (pkgs) => { this.packages = pkgs.filter((p) => p.type === 'gym'); },
      error: () => {},
    });
  }

  back(): void {
    this.router.navigate(['/employee/trainees']);
  }

  toggleSellPanel(): void {
    this.selling = !this.selling;
    if (!this.selling) {
      this.sellPackageId = '';
    }
  }

  sellPackage(): void {
    if (!this.sellPackageId || !this.trainee) return;
    this.actionLoading = 'sell';
    this.gymSubService.purchase(this.trainee._id, this.sellPackageId).subscribe({
      next: () => {
        this.actionLoading = '';
        this.toast.success('Package sold');
        this.selling = false;
        this.sellPackageId = '';
        this.load(this.trainee._id);
      },
      error: (err: { message?: string }) => {
        this.actionLoading = '';
        this.toast.error(err.message || 'Sale failed');
      },
    });
  }

  renew(sub: any): void {
    this.actionLoading = sub._id;
    this.gymSubService.renew(sub._id).subscribe({
      next: () => {
        this.actionLoading = '';
        this.toast.success('Plan renewed');
        this.load(this.trainee._id);
      },
      error: (err: { message?: string }) => {
        this.actionLoading = '';
        this.toast.error(err.message || 'Renewal failed');
      },
    });
  }

  cancel(sub: any): void {
    if (!window.confirm('Cancel this gym subscription?')) return;
    this.actionLoading = sub._id;
    this.gymSubService.cancel(sub._id).subscribe({
      next: () => {
        this.actionLoading = '';
        this.toast.success('Plan cancelled');
        this.load(this.trainee._id);
      },
      error: (err: { message?: string }) => {
        this.actionLoading = '';
        this.toast.error(err.message || 'Cancel failed');
      },
    });
  }

  packageName(sub: any): string {
    const p = sub.packageId;
    if (typeof p === 'object' && p?.name) return p.name;
    return '—';
  }

  coachName(sub: any): string {
    const c = sub.coachId;
    if (typeof c === 'object' && c?.firstName) {
      return `${c.firstName} ${c.lastName || ''}`.trim();
    }
    return '—';
  }

  statusTone(status: string): StatusTone {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  }

  paymentTone(status: string): StatusTone {
    return status === 'paid' ? 'success' : 'warning';
  }
}
