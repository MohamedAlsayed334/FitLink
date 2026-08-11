import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AppNotification, NotificationList } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private api: ApiService) {}

  list(): Observable<NotificationList> {
    return this.api.get<NotificationList>('/notifications');
  }

  markAllRead(): Observable<unknown> {
    return this.api.put<unknown>('/notifications/read-all');
  }

  markRead(id: string): Observable<unknown> {
    return this.api.put<unknown>(`/notifications/${id}/read`);
  }
}