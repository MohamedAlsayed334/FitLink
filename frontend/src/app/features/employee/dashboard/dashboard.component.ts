import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EmployeeService, EmployeeStats } from '../../../core/services/employee.service';

@Component({
  selector: 'fit-employee-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class EmployeeDashboardComponent implements OnInit {
  stats: EmployeeStats | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private employee: EmployeeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.employee.stats().subscribe({
      next: (s) => { this.stats = s; this.loading = false; },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load stats'; this.loading = false; },
    });
  }

  go(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
