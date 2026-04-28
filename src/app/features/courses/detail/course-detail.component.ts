import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CourseService } from '../../../core/services/course.service';
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
  private readonly enrollSvc  = inject(EnrollmentService);
  private readonly toast      = inject(ToastService);
  readonly auth               = inject(AuthService);

  course     = signal<Course | null>(null);
  reviews    = signal<Review[]>([]);
  loading    = signal(true);
  isEnrolled = signal(false);
  enrolling  = signal(false);
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
        if (this.auth.isLoggedIn()) this.checkEnrollment(id);
      },
      error: () => {
        this.toast.error('Course not found.');
        this.loading.set(false);
      },
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
}
