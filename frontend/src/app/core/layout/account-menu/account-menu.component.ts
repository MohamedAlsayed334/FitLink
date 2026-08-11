import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'fit-account-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="fit-account">
      <button class="fit-account__trigger" type="button" *ngIf="user$ | async as user" (click)="toggleMenu()" [attr.aria-expanded]="menuOpen" aria-haspopup="menu">
        <span class="fit-account__avatar">
          <img *ngIf="user.avatar; else initials" [src]="user.avatar" alt="{{ user.firstName }} {{ user.lastName }} avatar" />
          <ng-template #initials>{{ initialsOf(user) }}</ng-template>
        </span>
        <span class="fit-account__meta">
          <span class="fit-account__name">{{ user.firstName }} {{ user.lastName }}</span>
          <span class="fit-account__role">{{ user.role }}</span>
        </span>
      </button>

      <div class="fit-account__menu" *ngIf="menuOpen">
        <div class="fit-account__head" *ngIf="user$ | async as user">
          <span class="fit-account__name">{{ user.firstName }} {{ user.lastName }}</span>
          <span class="fit-account__email">{{ user.email }}</span>
        </div>
        <a routerLink="/account" (click)="closeMenu()" class="fit-account__link">My account</a>
        <button type="button" class="fit-account__link fit-account__danger" (click)="logout()">Sign out</button>
      </div>
    </div>
  `,
  styles: [
    `
      .fit-account {
        position: relative;
        display: inline-block;
      }

      .fit-account__trigger {
        display: inline-flex;
        align-items: center;
        gap: var(--space-3);
        min-height: 44px;
        padding: 0 var(--space-2);
        border: none;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
      }

      .fit-account__avatar {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--signal);
        color: var(--on-signal);
        font-family: var(--font-display);
        font-size: var(--fs-sm);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .fit-account__avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .fit-account__meta {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        line-height: 1;
      }

      .fit-account__name {
        font-size: var(--fs-sm);
        font-weight: 700;
        color: var(--ink);
      }

      .fit-account__role {
        font-family: var(--font-mono);
        font-size: var(--fs-xs);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--signal);
      }

      .fit-account__menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 220px;
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-2);
        padding: var(--space-2);
        z-index: 200;
        display: flex;
        flex-direction: column;
      }

      .fit-account__head {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: var(--space-2) var(--space-2) var(--space-3);
        border-bottom: 1px solid var(--line);
        margin-bottom: var(--space-1);
      }

      .fit-account__head .fit-account__name {
        font-size: var(--fs-sm);
        font-weight: 700;
        color: var(--ink);
      }

      .fit-account__head .fit-account__email {
        font-size: var(--fs-xs);
        color: var(--muted);
      }

      .fit-account__link {
        display: flex;
        align-items: center;
        width: 100%;
        min-height: 44px;
        padding: 0 var(--space-2);
        border: none;
        background: transparent;
        color: var(--ink);
        text-align: left;
        text-decoration: none;
        font-size: var(--fs-sm);
        font-weight: 600;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: color 0.15s ease, background-color 0.15s ease;
      }

      .fit-account__link:hover {
        color: var(--signal);
        background: var(--paper-soft);
      }

      .fit-account__danger {
        color: var(--danger);
      }

      .fit-account__danger:hover {
        color: var(--danger);
        background: var(--danger-soft);
      }
    `,
  ],
})
export class AccountMenuComponent {
  user$ = this.auth.currentUser$;
  menuOpen = false;

  constructor(private auth: AuthService, private elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.menuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onDocumentKeydownEscape(): void {
    this.menuOpen = false;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.auth.logout();
  }

  private getInitials(user: { firstName: string; lastName: string }): string {
    return `${(user.firstName || '?').charAt(0)}${(user.lastName || '?').charAt(0)}`.toUpperCase();
  }

  initialsOf(user: { firstName: string; lastName: string }): string {
    return this.getInitials(user);
  }
}