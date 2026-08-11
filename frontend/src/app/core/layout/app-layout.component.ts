import { Component, HostListener, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

const SIDEBAR_STORAGE_KEY = 'fitlink.sidebarOpen';

function readStoredSidebarOpen(): boolean | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return raw === null ? null : raw === 'true';
  } catch {
    return null;
  }
}

function writeStoredSidebarOpen(value: boolean): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
  } catch {
    // Ignore storage failures (e.g. private browsing).
  }
}

@Component({
  selector: 'fit-layout',
  standalone: false,
  template: `
    <fit-sidebar [isOpen]="sidebarOpen" (close)="closeSidebar()"></fit-sidebar>
    <main class="fit-main-content" [class.has-sidebar]="(user$ | async) && sidebarOpen">
      <fit-header (menuClick)="toggleSidebar()"></fit-header>
      <div class="fit-content"><router-outlet></router-outlet></div>
      <fit-footer></fit-footer>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .fit-main-content {
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        margin-left: 0;
        transition: margin-left 0.3s ease;
      }

      @media (min-width: 1024px) {
        .fit-main-content.has-sidebar {
          margin-left: var(--sidebar-width);
        }
      }

      .fit-content {
        flex: 1;
        min-width: 0;
        padding: clamp(1rem, 3vw, 1.5rem);
      }

      @media (min-width: 1024px) {
        .fit-content {
          padding: 32px;
        }
      }
    `,
  ],
})
export class AppLayoutComponent implements OnDestroy {
  user$ = this.auth.currentUser$;

  sidebarOpen =
    readStoredSidebarOpen() ?? (typeof window !== 'undefined' && window.innerWidth >= 1024);

  private destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          this.closeSidebar();
        }
      });
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void {
    this.sidebarOpen = (event.target as Window).innerWidth >= 1024;
    writeStoredSidebarOpen(this.sidebarOpen);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    writeStoredSidebarOpen(this.sidebarOpen);
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    writeStoredSidebarOpen(this.sidebarOpen);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
