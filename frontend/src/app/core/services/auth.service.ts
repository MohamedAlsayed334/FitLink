import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { User } from '../models/user.model';
import { ApiService } from './api.service';

const TOKEN_KEY = 'fitlink_token';
const USER_KEY = 'fitlink_user';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'trainee' | 'coach';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadStoredUser());

  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private api: ApiService, private router: Router) {}

  get currentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  login(email: string, password: string): Observable<User> {
    return this.api
      .post<{ token: string; user: User }>('/auth/login', { email, password })
      .pipe(
        tap(({ token, user }) => this.setAuth(token, user)),
        map(({ user }) => user),
      );
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.api
      .post<{ token: string; user: User }>('/auth/register', payload)
      .pipe(
        tap(({ token, user }) => this.setAuth(token, user)),
        map(({ user }) => user),
      );
  }

  setAuth(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUser;
  }

  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}