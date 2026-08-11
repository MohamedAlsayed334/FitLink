import { Component, Input } from '@angular/core';

@Component({
  selector: 'fit-star-rating',
  template: `
    <span class="stars" [attr.aria-label]="'Rated ' + rating + ' out of 5'">
      <span *ngFor="let star of stars" class="star" [class.filled]="star >= 0.5" [class.half]="star > 0 && star < 1" aria-hidden="true">
        <ng-container *ngIf="star >= 1">★</ng-container>
        <ng-container *ngIf="star > 0 && star < 1">⯨</ng-container>
      </span>
    </span>
  `,
  styles: [`
    .stars { display: inline-flex; gap: 1px; font-size: var(--fs-lg); line-height: 1; color: var(--line); }
    .star.filled { color: var(--signal); }
    .star.half { color: var(--signal); opacity: .65; }
  `],
})
export class StarRatingComponent {
  @Input() rating = 0;

  get stars(): number[] {
    const max = 5;
    return Array.from({ length: max }, (_, i) => {
      const val = this.rating - i;
      if (val >= 1) return 1;
      if (val > 0) return 0.5;
      return 0;
    });
  }
}