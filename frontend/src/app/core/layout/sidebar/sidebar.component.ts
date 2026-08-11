import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserRole } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  route: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_CONFIG: Record<UserRole, NavSection[]> = {
  trainee: [
    { title: 'Overview', items: [{ route: '/trainee', label: 'Dashboard', icon: '◈' }] },
    {
      title: 'Training',
      items: [
        { route: '/trainee/gym', label: 'Gym plan', icon: '🏋' },
        { route: '/trainee/coach', label: 'Coach', icon: '🎯' },
      ],
    },
    { title: 'Communication', items: [{ route: '/chat', label: 'Chat', icon: '💬' }] },
  ],
  coach: [
    { title: 'Overview', items: [{ route: '/coach', label: 'Dashboard', icon: '◈' }] },
    {
      title: 'Coaching',
      items: [
        { route: '/coach/trainees', label: 'Trainees', icon: '👥' },
        { route: '/coach/profile', label: 'Profile', icon: '👤' },
      ],
    },
    { title: 'Communication', items: [{ route: '/chat', label: 'Chat', icon: '💬' }] },
  ],
  employee: [
    { title: 'Overview', items: [{ route: '/employee', label: 'Dashboard', icon: '◈' }] },
    {
      title: 'Front Desk',
      items: [
        { route: '/employee/walk-in', label: 'Walk-in registration', icon: '🧾' },
        { route: '/employee/walk-ins', label: 'Recent walk-ins', icon: '🕐' },
        { route: '/employee/expirations', label: 'Expirations', icon: '⏳' },
      ],
    },
    { title: 'Members', items: [{ route: '/employee/trainees', label: 'Trainees', icon: '👥' }] },
  ],
  admin: [
    { title: 'Overview', items: [{ route: '/admin', label: 'Dashboard', icon: '◈' }] },
    {
      title: 'Management',
      items: [
        { route: '/admin/users', label: 'Users', icon: '👥' },
        { route: '/admin/packages', label: 'Packages', icon: '📦' },
        { route: '/admin/verification', label: 'Verification', icon: '✓' },
        { route: '/admin/cancellations', label: 'Cancellations', icon: '⏸' },
        { route: '/admin/moderation', label: 'Moderation', icon: '🛡' },
      ],
    },
  ],
};

const ACCOUNT_SECTION: NavSection = {
  title: 'Account',
  items: [{ route: '/account', label: 'My account', icon: '⚙' }],
};

const EXPANDED_STORAGE_KEY = 'fitlink.sidebarExpanded';

function readStoredExpanded(): { [title: string]: boolean } {
  if (typeof localStorage === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as { [title: string]: boolean };
    }
  } catch {
    // Ignore storage failures (e.g. private browsing).
  }
  return {};
}

function writeStoredExpanded(expanded: { [title: string]: boolean }): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(expanded));
  } catch {
    // Ignore storage failures (e.g. private browsing).
  }
}

@Component({
  selector: 'fit-sidebar',
  standalone: false,
  template: `
    <ng-container *ngIf="user$ | async as user">
      <div class="fit-sidebar-overlay" [class.open]="isOpen" (click)="closeSidebar()"></div>
      <aside class="fit-sidebar" [class.open]="isOpen" aria-label="Primary">
        <div class="fit-sidebar__header">
          <a class="fit-sidebar__logo" [routerLink]="roleHome(user.role)" aria-label="FitLink home">
            <span class="fit-sidebar__mark">F</span>
            <span class="fit-sidebar__brand">
              <span class="fit-sidebar__wordmark">FITLINK</span>
              <span class="fit-sidebar__tagline">GYM &amp; COACH SUBSCRIPTIONS</span>
            </span>
          </a>
        </div>

        <nav class="fit-sidebar__nav">
          <div class="fit-sidebar__section" *ngFor="let section of sectionsFor(user.role)">
            <button
              type="button"
              class="fit-sidebar__section-title"
              (click)="toggleSection(section.title)"
              [attr.aria-expanded]="isExpanded(section.title)"
            >
              <span>{{ section.title }}</span>
              <span class="fit-sidebar__arrow">{{ isExpanded(section.title) ? '▾' : '▸' }}</span>
            </button>
            <ng-container *ngIf="isExpanded(section.title)">
              <a
                *ngFor="let item of section.items"
                class="fit-sidebar__item"
                [routerLink]="item.route"
                routerLinkActive="is-active"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="onItemClick()"
              >
                <span class="fit-sidebar__item-icon">{{ item.icon }}</span>
                <span class="fit-sidebar__item-label">{{ item.label }}</span>
              </a>
            </ng-container>
          </div>
        </nav>
      </aside>
    </ng-container>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .fit-sidebar-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 100;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .fit-sidebar-overlay.open {
        display: block;
        opacity: 1;
        visibility: visible;
      }

      @media (min-width: 1024px) {
        .fit-sidebar-overlay {
          display: none !important;
        }
      }

      .fit-sidebar {
        width: var(--sidebar-width);
        height: 100vh;
        height: 100dvh;
        background: var(--card);
        border-right: 1px solid var(--line);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        position: fixed;
        left: 0;
        top: 0;
        z-index: 200;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }

      .fit-sidebar.open {
        transform: translateX(0);
      }

      @media (min-width: 1024px) {
        .fit-sidebar {
          transform: translateX(-100%);
        }

        .fit-sidebar.open {
          transform: translateX(0);
        }
      }

      .fit-sidebar__header {
        padding: 20px;
        border-bottom: 1px solid var(--line);
      }

      .fit-sidebar__logo {
        display: flex;
        align-items: center;
        gap: 12px;
        text-decoration: none;
      }

      .fit-sidebar__mark {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        background: linear-gradient(135deg, var(--signal) 0%, var(--signal-deep) 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-weight: 400;
        font-size: 18px;
        color: var(--on-signal);
      }

      .fit-sidebar__brand {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .fit-sidebar__wordmark {
        font-family: var(--font-display);
        font-size: 16px;
        letter-spacing: 0.06em;
        color: var(--ink);
        line-height: 1.2;
        white-space: nowrap;
      }

      .fit-sidebar__tagline {
        font-size: 10px;
        letter-spacing: 0.5px;
        color: var(--muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .fit-sidebar__nav {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 12px 0;
        scrollbar-width: thin;
        scrollbar-color: var(--line) transparent;
      }

      .fit-sidebar__nav::-webkit-scrollbar {
        width: 4px;
      }

      .fit-sidebar__nav::-webkit-scrollbar-track {
        background: transparent;
      }

      .fit-sidebar__nav::-webkit-scrollbar-thumb {
        background: var(--line);
        border-radius: 4px;
      }

      .fit-sidebar__section {
        margin-bottom: 8px;
      }

      .fit-sidebar__section-title {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        padding: 8px 20px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-family: var(--font-mono);
        font-size: 9px;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: var(--muted);
        transition: color 0.15s ease;
      }

      .fit-sidebar__section-title:hover {
        color: var(--ink);
      }

      .fit-sidebar__arrow {
        font-size: 10px;
      }

      .fit-sidebar__item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 20px;
        min-height: 40px;
        font-size: 12px;
        color: var(--ink-soft);
        transition: all 0.15s ease;
        position: relative;
        text-decoration: none;
      }

      .fit-sidebar__item::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 0;
        background: var(--signal);
        border-radius: 0 2px 2px 0;
        transition: height 0.15s ease;
      }

      .fit-sidebar__item:hover {
        background: var(--paper-soft);
        color: var(--ink);
      }

      .fit-sidebar__item.is-active {
        background: var(--paper-soft);
        background: color-mix(in srgb, var(--signal) 9%, transparent);
        color: var(--signal);
      }

      .fit-sidebar__item.is-active::before {
        height: 24px;
      }

      .fit-sidebar__item-icon {
        width: 20px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        line-height: 1;
        vertical-align: middle;
      }

      .fit-sidebar__item-label {
        flex: 1;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  user$ = this.auth.currentUser$;

  private expanded: { [title: string]: boolean } = readStoredExpanded();

  constructor(private auth: AuthService) {}

  sectionsFor(role: UserRole): NavSection[] {
    return [...(NAV_CONFIG[role] || []), ACCOUNT_SECTION];
  }

  toggleSection(title: string): void {
    this.expanded[title] = !this.isExpanded(title);
    writeStoredExpanded(this.expanded);
  }

  isExpanded(title: string): boolean {
    return this.expanded[title] !== false;
  }

  onItemClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.close.emit();
    }
  }

  closeSidebar(): void {
    this.close.emit();
  }

  roleHome(role: string): string {
    switch (role) {
      case 'trainee':
        return '/trainee';
      case 'coach':
        return '/coach';
      case 'employee':
        return '/employee';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  }
}
