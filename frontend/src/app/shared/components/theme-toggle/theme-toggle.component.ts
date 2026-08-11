import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  standalone: true,
  imports: [AsyncPipe],
  selector: 'fit-theme-toggle',
  template: `
    <button
      class="theme-toggle"
      [attr.aria-label]="(themeService.darkMode$ | async) ? 'Switch to light mode' : 'Switch to dark mode'"
      (click)="themeService.toggle()"
    >
      <span class="icon">{{ (themeService.darkMode$ | async) ? '\u2600\uFE0F' : '\uD83C\uDF19' }}</span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: transparent;
      border: 1px solid var(--line);
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      line-height: 1;
    }

    .theme-toggle:hover {
      border-color: var(--signal);
      transform: scale(1.1);
    }

    .icon {
      transition: transform 0.2s ease, opacity 0.2s ease;
      display: inline-block;
    }

    .theme-toggle:hover .icon {
      transform: rotate(15deg);
    }
  `],
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}
}
