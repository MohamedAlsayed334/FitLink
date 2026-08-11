import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AdminSummary } from '../models/admin-summary.model';
import { AdminPendingCancellation } from '../models/admin-cancellation.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  summary(): Observable<AdminSummary> {
    return this.api.get<AdminSummary>('/admin/summary');
  }

  pendingCancellations(): Observable<AdminPendingCancellation[]> {
    return this.api.get<AdminPendingCancellation[]>('/admin/cancellations/pending');
  }

  unverifiedCoaches(): Observable<User[]> {
    return this.api.get<User[]>('/admin/coaches/unverified');
  }

  listUsers(params?: { role?: string; search?: string; isActive?: string }): Observable<User[]> {
    const query: Record<string, string | number | boolean> = {};
    if (params?.role) query['role'] = params.role;
    if (params?.search) query['search'] = params.search;
    if (params?.isActive != null) query['isActive'] = params.isActive;
    return this.api.get<User[]>('/admin/users', query);
  }

  setUserStatus(id: string, isActive: boolean): Observable<User> {
    return this.api.patch<User>(`/admin/users/${id}/status`, { isActive });
  }
}