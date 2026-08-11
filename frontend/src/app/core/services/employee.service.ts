import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { WalkInVisit } from '../models/walk-in-visit.model';

export interface EmployeeStats {
  todayWalkIns: number;
  todaySignups: number;
  activeMembers: number;
  expiringThisMonth: number;
  revenueToday: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  constructor(private api: ApiService) {}

  stats(): Observable<EmployeeStats> {
    return this.api.get<EmployeeStats>('/employee/stats');
  }

  walkIns(limit?: number): Observable<{ visits: WalkInVisit[] }> {
    return this.api.get<{ visits: WalkInVisit[] }>('/employee/walk-ins', limit ? { limit } : undefined);
  }

  trainees(search?: string): Observable<{ trainees: any[] }> {
    return this.api.get<{ trainees: any[] }>(
      '/employee/trainees',
      search ? { search } : undefined,
    );
  }

  traineeProfile(id: string): Observable<{ trainee: any; gymSubscriptions: any[]; coachSubscriptions: any[] }> {
    return this.api.get<{ trainee: any; gymSubscriptions: any[]; coachSubscriptions: any[] }>(
      `/employee/trainees/${id}`,
    );
  }
}
