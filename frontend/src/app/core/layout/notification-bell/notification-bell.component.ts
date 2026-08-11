import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { UserRole } from '../../models/user.model';
import { AppNotification } from '../../models/notification.model';

@Component({
  selector: 'fit-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bell">
      <button
        class="bell-trigger"
        type="button"
        aria-label="Notifications"
        aria-haspopup="true"
        [attr.aria-expanded]="open"
        (click)="toggle()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
        </svg>
        <span class="bell-badge" *ngIf="unreadCount">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <div class="bell-scrim" *ngIf="open" (click)="close()"></div>

      <div class="bell-panel" *ngIf="open" role="dialog" aria-label="Notifications">
        <div class="bell-header">
          <span class="bell-title">Notifications</span>
          <button
            type="button"
            class="bell-clear"
            (click)="markAllRead()"
            [disabled]="unreadCount === 0"
          >
            Mark all read
          </button>
        </div>

        <div class="bell-list" *ngIf="!loading && notifications.length; else empty">
          <ng-container *ngFor="let n of notifications">
            <button
              type="button"
              class="bell-item"
              [class.unread]="!n.read"
              (click)="itemClick(n)"
            >
              <span class="bell-dot" *ngIf="!n.read" aria-hidden="true"></span>
              <span class="bell-item-title">{{ n.title || labelFor(n.type) }}</span>
              <span class="bell-item-body" *ngIf="n.body">{{ n.body }}</span>
              <span class="bell-item-time">{{ relativeTime(n.createdAt) || (n.createdAt | date: 'shortTime') }}</span>
            </button>
          </ng-container>
        </div>

        <ng-template #empty>
          <p class="bell-empty">{{ loading ? 'Loading…' : 'No notifications yet' }}</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      .bell {
        position: relative;
        z-index: 300;
      }

      .bell-trigger {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 50%;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        transition: color 0.15s ease, background-color 0.15s ease;
      }

      .bell-trigger:hover {
        color: var(--signal);
        background: var(--paper-soft);
      }

      .bell-badge {
        position: absolute;
        top: 1px;
        right: 1px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9999px;
        background: var(--signal);
        color: var(--on-signal);
        font-size: var(--fs-xs);
        font-weight: 700;
        line-height: 18px;
        text-align: center;
        display: inline-block;
      }

      .bell-scrim {
        position: fixed;
        inset: 0;
        z-index: 290;
      }

      .bell-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: min(360px, calc(100vw - 32px));
        max-height: 420px;
        overflow-y: auto;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-2);
        z-index: 310;
      }

      .bell-header {
        position: sticky;
        top: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid var(--line);
        background: var(--card);
      }

      .bell-title {
        font-size: var(--fs-md);
        font-weight: 700;
        color: var(--ink);
      }

      .bell-clear {
        border: none;
        background: transparent;
        color: var(--signal);
        font-size: var(--fs-sm);
        font-weight: 600;
        cursor: pointer;
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        transition: background-color 0.15s ease;
      }

      .bell-clear:hover:not(:disabled) {
        background: var(--paper-soft);
      }

      .bell-clear:disabled {
        color: var(--muted-light);
        cursor: default;
      }

      .bell-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        width: 100%;
        padding: var(--space-3) var(--space-4);
        border: none;
        border-bottom: 1px solid var(--line);
        background: transparent;
        color: var(--ink);
        text-align: left;
        cursor: pointer;
        transition: background-color 0.15s ease;
      }

      .bell-item:hover {
        background: var(--paper-soft);
      }

      .bell-item.unread {
        background: var(--info-soft);
      }

      .bell-dot {
        position: absolute;
        top: var(--space-3);
        right: var(--space-3);
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--signal);
      }

      .bell-item-title {
        font-size: var(--fs-md);
        font-weight: 600;
        line-height: 1.3;
      }

      .bell-item-body {
        font-size: var(--fs-sm);
        color: var(--muted);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .bell-item-time {
        font-size: var(--fs-xs);
        color: var(--muted-light);
      }

      .bell-empty {
        margin: 0;
        padding: var(--space-5) var(--space-4);
        text-align: center;
        color: var(--muted);
        font-size: var(--fs-sm);
      }

      @media (max-width: 480px) {
        .bell-item,
        .bell-header {
          padding-left: var(--space-3);
          padding-right: var(--space-3);
        }
      }
    `,
  ],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  unreadCount = 0;
  open = false;
  loading = true;

  private subs: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.notificationService.list().subscribe({
        next: (result) => {
          this.notifications = result.items || [];
          this.unreadCount = result.unreadCount || 0;
          this.loading = false;
        },
        error: () => {
          this.notifications = [];
          this.unreadCount = 0;
          this.loading = false;
        },
      }),
    );

    this.subs.push(
      this.socketService.notification$.subscribe((notification) => {
        const existing = this.notifications.findIndex((n) => n._id === notification._id);
        if (existing >= 0) {
          this.notifications[existing] = notification;
        } else {
          this.notifications = [notification, ...this.notifications].slice(0, 50);
        }
        if (!notification.read) {
          this.unreadCount += 1;
        }
        this.notifications = [...this.notifications].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  toggle(): void {
    this.open = !this.open;
  }

  close(): void {
    this.open = false;
  }

  itemClick(notification: AppNotification): void {
    if (!notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notificationService.markRead(notification._id).subscribe({
        error: () => {
          notification.read = false;
          this.unreadCount += 1;
        },
      });
    }

    const user = this.authService.currentUser;
    if (!user) {
      return;
    }
    const route = this.routeFor(notification, user.role);
    if (route) {
      this.open = false;
      this.router.navigate([route]);
    }
  }

  private routeFor(notification: AppNotification, role: UserRole): string | null {
    const type = notification.type || '';
    const isCancellation = [
      'cancellation_request',
      'cancellation_approved',
      'cancellation_rejected',
    ].includes(type);
    const isRating = ['new_rating', 'rating_moderated'].includes(type);
    const isSubscription = type.startsWith('subscription_');
    const isExpiry = type.startsWith('expiry_');
    const isWalkin = type === 'walkin_created';
    const isCoachVerified = type === 'coach_verified';

    switch (role) {
      case 'admin':
        if (isRating) return '/admin/moderation';
        if (isCoachVerified) return '/admin/verification';
        if (isCancellation) return '/admin/cancellations';
        return '/admin';
      case 'coach':
        if (isCoachVerified) return '/coach/profile';
        if (isRating) return '/coach/profile';
        if (type === 'cancellation_request') return '/coach?pendingCancel=1';
        if (isCancellation) return '/coach';
        return '/coach';
      case 'trainee':
        if (isCancellation) return '/trainee/coach';
        if (isSubscription || isExpiry || isWalkin) {
          return this.traineeTarget(notification);
        }
        return '/trainee';
      case 'employee':
        return '/employee';
      default:
        return null;
    }
  }

  private traineeTarget(notification: AppNotification): string {
    const text = `${notification.title || ''} ${notification.body || ''}`.toLowerCase();
    if (/(gym|membership|plan)/.test(text)) {
      return '/trainee/gym';
    }
    return '/trainee/coach';
  }

  markAllRead(): void {
    if (this.unreadCount === 0) {
      return;
    }
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.unreadCount = 0;
    this.notificationService.markAllRead().subscribe();
  }

  labelFor(type: string): string {
    if (!type) {
      return 'Update';
    }
    const parts = type.split(/[_-]+/).filter(Boolean);
    if (!parts.length) {
      return 'Update';
    }
    return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  relativeTime(createdAt: string): string {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) {
      return '';
    }
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) {
      return 'just now';
    }
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ago`;
    }
    return date.toLocaleDateString();
  }
}