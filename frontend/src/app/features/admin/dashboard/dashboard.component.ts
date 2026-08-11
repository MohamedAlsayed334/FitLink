import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminSummary } from '../../../core/models/admin-summary.model';

@Component({
  selector: 'fit-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  summary: AdminSummary | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private admin: AdminService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.admin.summary().subscribe({
      next: (s) => { this.summary = s; this.loading = false; },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load summary'; this.loading = false; },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
