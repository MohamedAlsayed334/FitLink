import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}

  getProfile(): Observable<User> {
    return this.api.get<User>('/users');
  }

  update(payload: Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'avatar'>>): Observable<User> {
    return this.api.put<User>('/users', payload);
  }
}