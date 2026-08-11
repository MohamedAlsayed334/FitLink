import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

interface TitleInfo {
  title: string;
  subtitle: string;
}

@Component({
  selector: 'fit-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnDestroy {
  @Output() menuClick = new EventEmitter<void>();

  user: User | null = null;

  pageTitle = 'FitLink';
  pageSubtitle = 'Gym & coach subscriptions';

  private readonly routeTitles: Record<string, TitleInfo> = {
    '/': { title: 'Dashboard', subtitle: 'System overview & statistics' },
    '/coaches': { title: 'Coaches', subtitle: 'Find your next coach' },
    '/chat': { title: 'Chat', subtitle: 'Your conversations' },
    '/account': { title: 'My account', subtitle: 'Profile & settings' },
    '/trainee': { title: 'Dashboard', subtitle: 'Your training overview' },
    '/trainee/gym': { title: 'Gym plan', subtitle: 'Your gym programme' },
    '/trainee/coach': { title: 'Coach', subtitle: 'Your coaching relationship' },
    '/coach': { title: 'Dashboard', subtitle: 'Coaching overview' },
    '/coach/trainees': { title: 'Trainees', subtitle: 'Manage your trainees' },
    '/coach/profile': { title: 'Profile', subtitle: 'Your coach profile' },
    '/employee': { title: 'Dashboard', subtitle: 'Operations overview' },
    '/employee/walk-in': { title: 'Walk-in registration', subtitle: 'New member signup' },
    '/employee/walk-ins': { title: 'Recent walk-ins', subtitle: 'Front desk activity' },
    '/employee/expirations': { title: 'Expirations', subtitle: 'Renewals due this month' },
    '/employee/trainees': { title: 'Trainees', subtitle: 'Member directory' },
    '/employee/trainees/:id': { title: 'Trainee profile', subtitle: 'Member details' },
    '/admin': { title: 'Dashboard', subtitle: 'Administration' },
    '/admin/packages': { title: 'Packages', subtitle: 'Manage subscriptions' },
    '/admin/verification': { title: 'Verification', subtitle: 'Verify coaches' },
    '/admin/cancellations': { title: 'Cancellations', subtitle: 'Pending cancellation requests' },
    '/admin/users': { title: 'Users', subtitle: 'Manage members' },
    '/admin/moderation': { title: 'Moderation', subtitle: 'Review & moderate' },
    '/login': { title: 'Login', subtitle: 'Welcome back' },
    '/register': { title: 'Register', subtitle: 'Create your account' },
  };

  private destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((u) => (this.user = u));

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => this.setTitle(event.urlAfterRedirects));

    this.setTitle(this.router.url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMenuClick(): void {
    this.menuClick.emit();
  }

  roleHome(role: string): string {
    switch (role) {
      case 'trainee':
        return '/trainee';
      case 'coach':
        return '/coach';
      case 'employee':
        return '/employee';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  }

  logout(): void {
    this.auth.logout();
  }

  private setTitle(url: string): void {
    const path = url.split(/[?#]/)[0];
    const info =
      this.routeTitles[path] ||
      this.bestMatch(path) || { title: 'FitLink', subtitle: 'Gym & coach subscriptions' };
    this.pageTitle = info.title;
    this.pageSubtitle = info.subtitle;
  }

  private bestMatch(path: string): TitleInfo | null {
    let best: TitleInfo | null = null;
    let bestLength = -1;
    for (const [key, value] of Object.entries(this.routeTitles)) {
      if (key !== '/' && path.startsWith(key) && key.length > bestLength) {
        best = value;
        bestLength = key.length;
      }
    }
    return best;
  }
}
