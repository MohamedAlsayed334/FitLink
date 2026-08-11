import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { EmployeeService } from '../../../core/services/employee.service';
import { GymSubscriptionService } from '../../../core/services/gym-subscription.service';
import { WalkInVisit } from '../../../core/models/walk-in-visit.model';
import { GymSubscription } from '../../../core/models/gym-subscription.model';
import { StatusTone } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'fit-walk-ins',
  templateUrl: './walk-ins.component.html',
  styleUrls: ['./walk-ins.component.css'],
})
export class WalkInsComponent implements OnInit {
  visits: WalkInVisit[] = [];
  signups: GymSubscription[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private employee: EmployeeService,
    private gymSubService: GymSubscriptionService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    forkJoin({
      visits: this.employee.walkIns(30),
      signups: this.gymSubService.list({ limit: 20 }),
    }).subscribe({
      next: (res) => {
        this.visits = res.visits.visits || [];
        this.signups = res.signups.subscriptions || [];
        this.loading = false;
      },
      error: (err: { message?: string }) => {
        this.errorMessage = err.message || 'Failed to load walk-ins';
        this.loading = false;
      },
    });
  }

  handledByName(visit: WalkInVisit): string {
    const h = visit.handledBy;
    if (!h) return '—';
    return `${h.firstName || ''} ${h.lastName || ''}`.trim() || '—';
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

  statusTone(status: string): StatusTone {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'warning';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  }
}
