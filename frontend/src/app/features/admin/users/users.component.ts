import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { User, UserRole } from '../../../core/models/user.model';
import { StatusTone } from '../../../shared/components/status-pill/status-pill.component';

@Component({
  selector: 'fit-admin-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  loading = true;
  errorMessage = '';
  role = 'all';
  status = 'all';
  search = '';
  actionLoading = '';

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private admin: AdminService, private toast: ToastService) {}

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.load());
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(): void {
    this.search$.next(this.search);
  }

  onRoleChange(): void {
    this.load();
  }

  onStatusChange(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    const params: { role?: string; search?: string; isActive?: string } = {};
    if (this.role !== 'all') params.role = this.role;
    if (this.status === 'active') params.isActive = 'true';
    if (this.status === 'inactive') params.isActive = 'false';
    if (this.search.trim()) params.search = this.search.trim();
    this.admin.listUsers(params).subscribe({
      next: (items) => { this.users = items || []; this.loading = false; },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load users'; this.loading = false; },
    });
  }

  toggleStatus(user: User): void {
    this.actionLoading = user._id;
    this.admin.setUserStatus(user._id, !user.isActive).subscribe({
      next: (updated) => {
        this.actionLoading = '';
        this.toast.success(updated.isActive ? 'User activated' : 'User deactivated');
        this.users = this.users.map((u) => (u._id === updated._id ? updated : u));
      },
      error: (err: { message?: string }) => {
        this.actionLoading = '';
        this.toast.error(err.message || 'Update failed');
      },
    });
  }

  roleLabel(role: UserRole): string {
    switch (role) {
      case 'coach': return 'Coach';
      case 'trainee': return 'Trainee';
      case 'employee': return 'Employee';
      case 'admin': return 'Admin';
      default: return role;
    }
  }

  roleTone(role: UserRole): StatusTone {
    switch (role) {
      case 'coach': return 'warning';
      case 'trainee': return 'success';
      case 'employee': return 'info';
      case 'admin': return 'neutral';
      default: return 'neutral';
    }
  }
}
