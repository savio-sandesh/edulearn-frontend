import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CourseService } from '../../../core/services/course.service';
import { ContentService } from '../../../core/services/content.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { Course, Review } from '../../../core/models';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, StarRatingComponent, LoaderComponent],
  templateUrl: './course-detail.component.html',
  styleUrl:    './course-detail.component.scss',
})
export class CourseDetailComponent implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly coursesSvc = inject(CourseService);
  private readonly contentSvc = inject(ContentService);
  private readonly enrollSvc  = inject(EnrollmentService);
  private readonly toast      = inject(ToastService);
  readonly auth               = inject(AuthService);

  course       = signal<Course | null>(null);
  reviews      = signal<Review[]>([]);
  loading      = signal(true);
  isEnrolled   = signal(false);
  enrolling    = signal(false);
  totalDuration = signal(0);
  checkingEnrollment = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;
    this.loadCourse(id);
  }

  private loadCourse(id: number): void {
    this.loading.set(true);
    this.coursesSvc.getById(id).subscribe({
      next: (course) => {
        this.course.set(course);
        this.loading.set(false);
        this.loadReviews(id);
        this.loadTotalDuration(id);
        if (this.auth.isLoggedIn()) this.checkEnrollment(id);
      },
      error: () => {
        this.toast.error('Course not found.');
        this.loading.set(false);
      },
    });
  }

  private loadTotalDuration(courseId: number): void {
    this.contentSvc.getTotalDuration(courseId).subscribe({
      next: (res) => this.totalDuration.set(res.totalMinutes),
      error: () => {}
    });
  }

  private loadReviews(courseId: number): void {
    this.coursesSvc.getReviews(courseId).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => {},
    });
  }

  private checkEnrollment(courseId: number): void {
    this.checkingEnrollment.set(true);
    this.enrollSvc.checkEnrollment(courseId).subscribe({
      next: (result) => {
        this.isEnrolled.set(result.isEnrolled);
        this.checkingEnrollment.set(false);
      },
      error: () => this.checkingEnrollment.set(false),
    });
  }

  enroll(): void {
    if (!this.auth.isLoggedIn()) {
      this.toast.info('Please sign in to enroll.');
      return;
    }
    const course = this.course();
    if (!course) return;
    this.enrolling.set(true);
    this.enrollSvc.enroll(course.courseId).subscribe({
      next: () => {
        this.isEnrolled.set(true);
        this.enrolling.set(false);
        this.toast.success('🎉 Enrolled successfully! Start learning now.');
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Enrollment failed.');
        this.enrolling.set(false);
      },
    });
  }

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  get starArray(): number[] { return [1, 2, 3, 4, 5]; }

  reviewRating = signal(0);
  reviewComment = signal('');
  submittingReview = signal(false);

  setRating(r: number) {
    this.reviewRating.set(r);
  }

  updateComment(event: Event) {
    this.reviewComment.set((event.target as HTMLTextAreaElement).value);
  }

  submitReview() {
    if (this.reviewRating() === 0) {
      this.toast.error('Please select a rating.');
      return;
    }
    const c = this.course();
    if (!c) return;

    this.submittingReview.set(true);
    this.coursesSvc.addReview(c.courseId, {
      rating: this.reviewRating(),
      comment: this.reviewComment()
    }).subscribe({
      next: (rev) => {
        this.toast.success('Review submitted successfully!');
        this.reviews.update(list => [rev, ...list]);
        this.reviewRating.set(0);
        this.reviewComment.set('');
        this.submittingReview.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to submit review.');
        this.submittingReview.set(false);
      }
    });
  }
}
