import { Component, Input } from '@angular/core';

@Component({
  selector: 'fit-empty-state',
  template: `
    <div class="empty">
      <span class="empty-icon" aria-hidden="true">{{ icon }}</span>
      <h3 class="empty-title">{{ title }}</h3>
      <p *ngIf="message" class="empty-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .empty { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); text-align: center; padding: var(--space-6); color: var(--muted); }
    .empty-icon { font-size: 2rem; }
    .empty-title { font-family: var(--font-display); font-size: var(--fs-lg); text-transform: uppercase; color: var(--ink); margin: 0; }
    .empty-message { margin: 0; font-size: var(--fs-sm); max-width: 42ch; }
  `],
})
export class EmptyStateComponent {
  @Input() icon = '◇';
  @Input() title = '';
  @Input() message = '';
}