import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

const ROLE_HOME: Record<string, string> = {
  coach: '/coach',
  trainee: '/trainee',
  admin: '/admin',
  employee: '/employee',
};

@Component({
  selector: 'fit-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  user: User | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dashboardLink(): string {
    return this.user ? ROLE_HOME[this.user.role] || '/dashboard' : '/login';
  }

  firstName(): string {
    return this.user?.firstName || '';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}