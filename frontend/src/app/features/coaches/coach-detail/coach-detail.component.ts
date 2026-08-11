import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CoachService } from '../../../core/services/coach.service';
import { RatingService } from '../../../core/services/rating.service';
import { PackageService } from '../../../core/services/package.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiError } from '../../../core/services/api.service';
import { User } from '../../../core/models/user.model';
import { Package } from '../../../core/models/package.model';
import { Rating } from '../../../core/models/rating.model';

const ROLE_HOME: Record<string, string> = {
  coach: '/coach',
  trainee: '/trainee',
  admin: '/admin',
  employee: '/employee',
};

interface ReviewItem extends Rating {
  authorName?: string;
}

@Component({
  selector: 'fit-coach-detail',
  templateUrl: './coach-detail.component.html',
  styleUrls: ['./coach-detail.component.css'],
})
export class CoachDetailComponent implements OnInit, OnDestroy {
  coach: User | null = null;
  reviews: ReviewItem[] = [];
  allCoachPackages: Package[] = [];
  packages: Package[] = [];
  errorMessage = '';
  user: User | null = null;

  coachId = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coachService: CoachService,
    private ratingService: RatingService,
    private packageService: PackageService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.coachId = this.route.snapshot.paramMap.get('id') || '';

    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
    });

    this.loadCoach();
    this.loadReviews();
    this.loadPackages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get averageRating(): number {
    return this.coach?.coachProfile?.averageRating || 0;
  }

  get isTrainee(): boolean {
    return this.user?.role === 'trainee';
  }

  get totalReviews(): number {
    return this.coach?.coachProfile?.totalReviews || 0;
  }

  dashboardLink(): string {
    return this.user ? ROLE_HOME[this.user.role] || '/dashboard' : '/login';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  private loadCoach(): void {
    if (!this.coachId) {
      return;
    }
    this.errorMessage = '';
    this.coachService
      .get(this.coachId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (coach) => {
          this.coach = coach;
          // Packages may have loaded before the coach; re-scope them now that we
          // know this coach's specializations.
          this.applyPackageFilter();
        },
        error: (error: ApiError) => {
          this.errorMessage = error?.message || 'Failed to load coach profile';
        },
      });
  }

  private loadReviews(): void {
    if (!this.coachId) {
      return;
    }
    this.ratingService
      .forCoach(this.coachId, { limit: 10, offset: 0 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.reviews = ((page?.reviews || []) as Rating[]).map((r) => ({
            ...r,
            authorName: this.resolveAuthorName(r),
          })) as ReviewItem[];
        },
        error: () => {
          this.reviews = [];
        },
      });
  }

  private resolveAuthorName(r: Rating): string {
    // Backend `getCoachReviews` populates `traineeId` with the trainee's
    // `{ firstName, lastName, avatar }`; fall back to other author references
    // on the payload, and keep "Trainee" only as a last resort.
    const raw = r as unknown as {
      traineeId?: string | { firstName?: string; lastName?: string };
      traineeName?: string;
      author?: { firstName?: string; lastName?: string };
    };

    const trainee = raw.traineeId;
    if (typeof trainee === 'object' && trainee) {
      const name = `${trainee.firstName || ''} ${trainee.lastName || ''}`.trim();
      if (name) {
        return name;
      }
    }

    const embeddedName = raw.traineeName?.trim();
    if (embeddedName) {
      return embeddedName;
    }

    const author = raw.author;
    if (author) {
      const name = `${author.firstName || ''} ${author.lastName || ''}`.trim();
      if (name) {
        return name;
      }
    }

    return 'Trainee';
  }

  private loadPackages(): void {
    this.packageService
      .list()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (packages) => {
          this.allCoachPackages = (packages || []).filter((p) => p.type === 'coach');
          this.applyPackageFilter();
        },
        error: () => {
          this.allCoachPackages = [];
          this.applyPackageFilter();
        },
      });
  }

  private applyPackageFilter(): void {
    this.packages = this.scopePackagesToCoach(this.allCoachPackages);
  }

  private scopePackagesToCoach(all: Package[]): Package[] {
    // The Package model carries no coach linkage (no coachId, no specialization
    // field) and GET /packages is a single global list, so the backend offers no
    // per-coach package scope. This is a client-side approximation: only show a
    // coach package when its NAME matches one of this coach's specializations.
    const specs = (this.coach?.coachProfile?.specialization || [])
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (specs.length === 0) {
      return all;
    }
    return all.filter((p) => specs.some((s) => p.name.toLowerCase().includes(s)));
  }
}