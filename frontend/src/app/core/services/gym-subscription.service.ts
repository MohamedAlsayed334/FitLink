import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { GymSubscription } from '../models/gym-subscription.model';

export interface WalkInPayload {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  password?: string;
  packageId: string;
  mode: 'quick' | 'full';
}

export interface SubscriptionListResult {
  subscriptions: GymSubscription[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class GymSubscriptionService {
  constructor(private api: ApiService) {}

  subscribe(packageId: string): Observable<GymSubscription> {
    return this.api.post<GymSubscription>('/gym-subscriptions', { packageId });
  }

  walkIn(payload: WalkInPayload): Observable<GymSubscription> {
    return this.api.post<GymSubscription>('/gym-subscriptions/walk-in', payload);
  }

  list(params?: {
    status?: string;
    search?: string;
    limit?: number;
    page?: number;
  }): Observable<SubscriptionListResult> {
    return this.api.get<SubscriptionListResult>('/gym-subscriptions', params);
  }

  purchase(traineeId: string, packageId: string): Observable<GymSubscription> {
    return this.api.post<GymSubscription>(`/gym-subscriptions/${traineeId}/purchase`, { packageId });
  }

  mine(): Observable<GymSubscription[]> {
    return this.api.get<GymSubscription[]>('/gym-subscriptions/mine');
  }

  renew(id: string): Observable<GymSubscription> {
    return this.api.put<GymSubscription>(`/gym-subscriptions/${id}/renew`);
  }

  cancel(id: string): Observable<GymSubscription> {
    return this.api.put<GymSubscription>(`/gym-subscriptions/${id}/cancel`);
  }
}