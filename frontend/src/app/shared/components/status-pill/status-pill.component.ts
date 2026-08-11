import { Component, Input } from '@angular/core';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

@Component({
  selector: 'fit-status-pill',
  template: `<span class="pill status-pill" [class]="tone">{{ label }}</span>`,
  styles: [`
    .pill {
      display: inline-flex;
      align-items: center;
      font-family: var(--font-mono);
      font-size: var(--fs-xs);
      letter-spacing: .1em;
      text-transform: uppercase;
      border-radius: 999px;
      padding: 6px 12px;
      white-space: nowrap;
    }
    .success { background: var(--valid-soft); color: var(--valid); }
    .warning { background: var(--warn-soft); color: var(--warn); }
    .danger  { background: var(--danger-soft); color: var(--danger); }
    .neutral { background: var(--paper-soft); color: var(--muted); }
    .info    { background: var(--info-soft); color: var(--info); }
  `],
})
export class StatusPillComponent {
  @Input() label = '';
  @Input() tone: StatusTone = 'neutral';
}