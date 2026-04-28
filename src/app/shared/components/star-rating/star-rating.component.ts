import { Component, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: `
    <div class="stars" [class.interactive]="interactive()">
      @for (star of stars; track star) {
        <button
          class="star"
          [class.filled]="star <= displayRating()"
          [class.half]="isHalf(star)"
          (click)="interactive() && ratingChange.emit(star)"
          (mouseenter)="interactive() && hover.set(star)"
          (mouseleave)="interactive() && hover.set(0)"
          [disabled]="!interactive()"
          type="button"
        >★</button>
      }
      @if (showCount() && count() > 0) {
        <span class="count">({{ count() }})</span>
      }
    </div>
  `,
  styles: [`
    .stars { display: inline-flex; align-items: center; gap: 2px; }
    .star  {
      font-size: 1rem; color: #334155; transition: color 0.15s ease;
      background: none; border: none; padding: 0; line-height: 1;
    }
    .star.filled { color: #f59e0b; }
    .stars.interactive .star { cursor: pointer; }
    .stars.interactive .star:hover { transform: scale(1.15); }
    .count { font-size: 0.8rem; color: #64748b; margin-left: 4px; }
  `]
})
export class StarRatingComponent {
  rating      = input<number>(0);
  count       = input<number>(0);
  interactive = input<boolean>(false);
  showCount   = input<boolean>(true);
  ratingChange = output<number>();

  readonly stars = [1, 2, 3, 4, 5];
  hover = { value: 0, set(v: number) { this.value = v; } };

  displayRating = computed(() => this.hover.value || this.rating());
  isHalf = (star: number) => false; // full stars only for simplicity
}
