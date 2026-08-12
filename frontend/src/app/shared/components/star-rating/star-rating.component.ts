import { Component, Input } from '@angular/core';

@Component({
  selector: 'fit-star-rating',
  template: `
    <span
      class="star-rating"
      role="img"
      [attr.aria-label]="'Rated ' + rating + ' out of 5'">
      <span class="stars-bg" aria-hidden="true">
        <span class="star" *ngFor="let star of stars">★</span>
      </span>
      <span class="stars-fill" aria-hidden="true" [style.width.%]="fillPercent">
        <span class="star" *ngFor="let star of stars">★</span>
      </span>
    </span>
  `,
  styles: [`
    .star-rating {
      position: relative;
      display: inline-block;
      font-size: var(--fs-lg);
      line-height: 1;
      color: var(--line);
    }
    .stars-bg,
    .stars-fill {
      display: flex;
      gap: 1px;
      white-space: nowrap;
    }
    .stars-fill {
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
      color: var(--signal);
    }
  `],
})
export class StarRatingComponent {
  @Input() rating = 0;

  get stars(): number[] {
    return Array.from({ length: 5 });
  }

  get fillPercent(): number {
    const clamped = Math.max(0, Math.min(5, this.rating));
    return Math.round((clamped / 5) * 100);
  }
}
