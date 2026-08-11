import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Rating, RatingCriteria, RatingPage } from '../models/rating.model';

export interface CreateRatingPayload {
  coachId?: string;
  subscriptionId: string;
  comment?: string;
  criteria: RatingCriteria;
}

@Injectable({ providedIn: 'root' })
export class RatingService {
  constructor(private api: ApiService) {}

  create(payload: CreateRatingPayload): Observable<Rating> {
    return this.api.post<Rating>('/ratings', payload);
  }

  forCoach(coachId: string, params?: { limit?: number; offset?: number }): Observable<RatingPage> {
    return this.api.get<RatingPage>(`/ratings/coaches/${coachId}/ratings`, params ?? {});
  }

  pending(params?: { limit?: number; offset?: number }): Observable<{ items: Rating[]; total: number; limit: number; offset: number }> {
    return this.api.get<{ items: Rating[]; total: number; limit: number; offset: number }>('/ratings/pending', params ?? {});
  }

  moderate(id: string, payload: { moderationStatus: 'approved' | 'rejected'; moderationNote?: string }): Observable<Rating> {
    return this.api.put<Rating>(`/ratings/${id}/moderate`, payload);
  }
}