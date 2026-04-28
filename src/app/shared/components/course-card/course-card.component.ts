import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Course } from '../../../core/models';
import { StarRatingComponent } from '../star-rating/star-rating.component';

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [RouterLink, StarRatingComponent, DecimalPipe],
  template: `
    <a [routerLink]="['/courses', course().courseId]" class="course-card">
      <!-- Thumbnail -->
      <div class="thumb">
        @if (course().thumbnailUrl) {
          <img [src]="course().thumbnailUrl" [alt]="course().title" />
        } @else {
          <div class="thumb-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
              <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.95 49.95 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.01 50.01 0 0 0 7.5 12.174v-.224c0-.131.067-.248.172-.311a54.614 54.614 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.13 56.13 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.8 49.8 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z"/>
            </svg>
          </div>
        }
        <span class="level-badge">{{ course().level }}</span>
      </div>
      <!-- Body -->
      <div class="card-body">
        <span class="category">{{ course().category }}</span>
        <h3 class="title">{{ course().title }}</h3>
        @if (course().instructorName) {
          <p class="instructor">by {{ course().instructorName }}</p>
        }
        <div class="meta">
          <app-star-rating [rating]="course().averageRating ?? 0" [count]="0" [showCount]="false" />
          <span class="rating-num">{{ (course().averageRating ?? 0).toFixed(1) }}</span>
          <span class="enrollments">· {{ course().enrollmentCount | number }} students</span>
        </div>
        <div class="footer-row">
          <span class="price">{{ course().price === 0 ? 'Free' : ('$' + course().price.toFixed(2)) }}</span>
          <span class="arrow">→</span>
        </div>
      </div>
    </a>
  `,
  styles: [`
    .course-card {
      display: flex; flex-direction: column;
      background: #111122; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px; overflow: hidden;
      transition: all 0.25s ease; text-decoration: none;
      &:hover { border-color: rgba(124,58,237,0.4); transform: translateY(-4px);
                box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.15); }
    }
    .thumb {
      position: relative; height: 176px; overflow: hidden;
      background: #18182e;
      img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
      .course-card:hover img { transform: scale(1.05); }
    }
    .thumb-placeholder {
      width: 100%; height: 100%;
      background: linear-gradient(135deg,#18182e,#0c0c1a);
      display: flex; align-items: center; justify-content: center;
      color: rgba(124,58,237,0.4);
    }
    .level-badge {
      position: absolute; top: 10px; right: 10px;
      padding: 3px 10px; border-radius: 999px;
      font-size: 0.7rem; font-weight: 600;
      background: rgba(8,8,16,0.75); color: #a78bfa;
      border: 1px solid rgba(124,58,237,0.3); backdrop-filter: blur(8px);
    }
    .card-body { padding: 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .category { font-size: 0.72rem; font-weight: 600; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.06em; }
    .title { font-size: 0.97rem; font-weight: 600; color: #e2e8f0; line-height: 1.4;
             display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .instructor { font-size: 0.8rem; color: #64748b; }
    .meta { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; }
    .rating-num { color: #f59e0b; font-weight: 600; }
    .enrollments { color: #64748b; }
    .footer-row { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 8px;
                  border-top: 1px solid rgba(255,255,255,0.05); }
    .price { font-weight: 700; color: #e2e8f0; font-size: 1rem; }
    .arrow { color: #7c3aed; font-size: 1.1rem; transition: transform 0.2s;
             .course-card:hover & { transform: translateX(4px); } }
  `]
})
export class CourseCardComponent {
  course = input.required<Course>();
}
