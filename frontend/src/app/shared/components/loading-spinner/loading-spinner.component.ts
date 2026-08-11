import { Component, Input } from '@angular/core';

@Component({
  selector: 'fit-loading-spinner',
  template: `<div class="spinner-wrap"><span class="spinner"></span><span *ngIf="label" class="label">{{ label }}</span></div>`,
  styles: [`
    .spinner-wrap { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-6); }
    .spinner {
      width: 36px; height: 36px;
      border: 3px solid var(--line);
      border-top-color: var(--signal);
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    .label { font-family: var(--font-mono); font-size: var(--fs-xs); letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoadingSpinnerComponent {
  @Input() label = '';
}