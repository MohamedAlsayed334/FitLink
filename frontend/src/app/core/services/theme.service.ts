import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const THEME_KEY = 'fitlink_theme';
const MANUAL_KEY = 'fitlink_theme_manually_set';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  private mediaQuery: MediaQueryList | null = null;
  private mediaHandler = (e: MediaQueryListEvent) => this.onSystemThemeChange(e);

  darkMode$ = this.darkModeSubject.asObservable();

  get isDark(): boolean {
    return this.darkModeSubject.getValue();
  }

  constructor() {
    const initial = this.getInitialTheme();
    this.darkModeSubject.next(initial);
    this.applyTheme(initial);

    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.mediaHandler);
    }
  }

  ngOnDestroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.mediaHandler);
    }
  }

  toggle(): void {
    this.setDark(!this.isDark);
  }

  setDark(isDark: boolean): void {
    this.darkModeSubject.next(isDark);
    this.applyTheme(isDark);
    this.persist(isDark, true);
  }

  private getInitialTheme(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }

    const stored = localStorage.getItem(THEME_KEY);
    if (stored !== null) {
      return stored === 'dark';
    }

    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  }

  private applyTheme(dark: boolean): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
  }

  private persist(dark: boolean, manuallySet: boolean): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
      if (manuallySet) {
        localStorage.setItem(MANUAL_KEY, 'true');
      }
    }
  }

  private onSystemThemeChange(e: MediaQueryListEvent): void {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(MANUAL_KEY) === 'true') {
      return;
    }
    this.darkModeSubject.next(e.matches);
    this.applyTheme(e.matches);
    this.persist(e.matches, false);
  }
}
