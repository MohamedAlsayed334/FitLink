import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CoachSubscription } from '../models/coach-subscription.model';

@Injectable({ providedIn: 'root' })
export class CoachSubscriptionService {
  constructor(private api: ApiService) {}

  subscribe(coachId: string, packageId: string): Observable<CoachSubscription> {
    return this.api.post<CoachSubscription>('/coach-subscriptions', { coachId, packageId });
  }

  mine(): Observable<CoachSubscription | null> {
    return this.api.get<CoachSubscription | null>('/coach-subscriptions/mine');
  }

  myTrainees(): Observable<CoachSubscription[]> {
    return this.api.get<CoachSubscription[]>('/coach-subscriptions/my-trainees');
  }

  requestCancel(id: string, reason?: string): Observable<CoachSubscription> {
    return this.api.put<CoachSubscription>(`/coach-subscriptions/${id}/cancel-request`, reason ? { reason } : {});
  }

  processCancel(id: string): Observable<CoachSubscription> {
    return this.api.put<CoachSubscription>(`/coach-subscriptions/${id}/process-cancel`);
  }

  rejectCancel(id: string): Observable<CoachSubscription> {
    return this.api.put<CoachSubscription>(`/coach-subscriptions/${id}/cancel-reject`);
  }
}