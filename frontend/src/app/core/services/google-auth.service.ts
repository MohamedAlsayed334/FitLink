import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

declare global {
  interface Window {
    google?: any;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private pending: Promise<boolean> | null = null;

  private userSubject = new Subject<User>();
  private errorSubject = new Subject<string>();

  user$ = this.userSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  isEnabled(): boolean {
    return !!environment.googleClientId;
  }

  load(): Promise<boolean> {
    if (!this.isEnabled()) {
      return Promise.resolve(false);
    }

    if ((window as any).google?.accounts?.id) {
      this.initialize();
      return Promise.resolve(true);
    }

    if (!this.pending) {
      this.pending = new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          this.initialize();
          resolve(true);
        };
        script.onerror = () => {
          this.pending = null;
          resolve(false);
        };
        document.head.appendChild(script);
      });
    }

    return this.pending;
  }

  renderButton(container: HTMLElement): void {
    const width = container.clientWidth || 320;
    (window as any).google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      width,
    });
  }

  exchange(credential: string): void {
    this.api.post<{ token: string; user: User }>('/auth/google', { credential }).subscribe({
      next: ({ token, user }) => {
        this.auth.setAuth(token, user);
        this.userSubject.next(user);
      },
      error: () => {
        this.errorSubject.next('Could not sign you in with Google. Please try again.');
      },
    });
  }

  private initialize(): void {
    (window as any).google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => this.exchange(response.credential),
    });
  }
}