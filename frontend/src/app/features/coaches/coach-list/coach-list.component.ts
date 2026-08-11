import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CoachService } from '../../../core/services/coach.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiError } from '../../../core/services/api.service';
import { User } from '../../../core/models/user.model';

const SPECIALIZATIONS = [
  'strength',
  'hypertrophy',
  'weight-loss',
  'endurance',
  'crossfit',
  'nutrition',
  'rehabilitation',
];

const ROLE_HOME: Record<string, string> = {
  coach: '/coach',
  trainee: '/trainee',
  admin: '/admin',
  employee: '/employee',
};

@Component({
  selector: 'fit-coach-list',
  templateUrl: './coach-list.component.html',
  styleUrls: ['./coach-list.component.css'],
})
export class CoachListComponent implements OnInit, OnDestroy {
  coaches: User[] = [];
  loading = true;
  loadingMore = false;
  errorMessage = '';
  user: User | null = null;

  specializations = SPECIALIZATIONS;
  selectedSpecialization: string | null = null;
  minRating: number | null = null;

  private readonly limit = 20;
  private offset = 0;
  hasMore = true;

  private destroy$ = new Subject<void>();

  constructor(
    private coachService: CoachService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
    });
    this.load(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectSpecialization(specialization: string): void {
    this.selectedSpecialization = this.selectedSpecialization === specialization ? null : specialization;
    this.load(true);
  }

  onFilterChange(): void {
    this.load(true);
  }

  loadMore(): void {
    if (!this.hasMore || this.loading || this.loadingMore) {
      return;
    }
    this.load(false);
  }

  dashboardLink(): string {
    return this.user ? ROLE_HOME[this.user.role] || '/dashboard' : '/login';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  private load(reset: boolean): void {
    this.errorMessage = '';
    if (reset) {
      this.loading = true;
    } else {
      this.loadingMore = true;
    }

    const offset = reset ? 0 : this.offset;
    this.coachService
      .list({
        specialization: this.selectedSpecialization ?? undefined,
        minRating: this.minRating ?? undefined,
        limit: this.limit,
        offset,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coaches) => {
          this.loading = false;
          this.loadingMore = false;
          this.coaches = reset ? coaches : [...this.coaches, ...coaches];
          this.offset = offset + coaches.length;
          this.hasMore = coaches.length >= this.limit;
        },
        error: (error: ApiError) => {
          this.loading = false;
          this.loadingMore = false;
          this.errorMessage = error?.message || 'Failed to load coaches';
        },
      });
  }
}