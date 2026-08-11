import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, CoachProfile } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class CoachService {
  constructor(private api: ApiService) {}

  list(params?: { specialization?: string | string[]; minRating?: number; limit?: number; offset?: number }): Observable<User[]> {
    const query: Record<string, string | number | boolean> = {};
    if (params?.specialization) query['specialization'] = Array.isArray(params.specialization) ? params.specialization.join(',') : params.specialization;
    if (params?.minRating != null) query['minRating'] = params.minRating;
    if (params?.limit != null) query['limit'] = params.limit;
    if (params?.offset != null) query['offset'] = params.offset;
    return this.api.get<User[]>('/coaches', query);
  }

  get(id: string): Observable<User> {
    return this.api.get<User>(`/coaches/${id}`);
  }

  updateProfile(payload: Partial<CoachProfile> & { isAcceptingClients?: boolean }): Observable<User> {
    return this.api.put<User>('/coaches/profile', payload);
  }

  verify(id: string): Observable<User> {
    return this.api.put<User>(`/coaches/${id}/verify`);
  }
}