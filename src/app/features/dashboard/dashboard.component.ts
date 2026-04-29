import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { AuthService } from '../../core/services/auth.service';
import { Enrollment, Course } from '../../core/models';
import { DatePipe } from '@angular/common';
import { CourseService } from '../../core/services/course.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly enrollSvc = inject(EnrollmentService);
  private readonly authSvc   = inject(AuthService);
  private readonly courseSvc = inject(CourseService);

  readonly user = this.authSvc.currentUser;
  
  readonly enrollments = signal<Enrollment[]>([]);
  readonly loading = signal(true);

  // Derived state
  readonly activeCourses = computed(() => 
    this.enrollments().filter(e => !e.isCompleted)
  );
  
  readonly completedCourses = computed(() => 
    this.enrollments().filter(e => e.isCompleted)
  );

  ngOnInit(): void {
    this.enrollSvc.getMyEnrollments().subscribe({
      next: (data: any[]) => {
        // Map backend DTO to frontend model
        let mapped = data.map(e => ({
          ...e,
          progress: e.progressPercent || 0,
          isCompleted: e.status === 'COMPLETED',
          hasCertificate: e.certificateIssued || false
        } as Enrollment));

        this.enrollments.set(mapped);

        // Fetch all courses to hydrate details
        this.courseSvc.getAll().subscribe({
          next: (courses) => {
            const courseMap = new Map<number, Course>();
            courses.forEach(c => courseMap.set(c.courseId, c));

            mapped = mapped.map(e => {
              const course = courseMap.get(e.courseId);
              return {
                ...e,
                courseTitle: course?.title,
                courseThumbnailUrl: course?.thumbnailUrl,
                courseCategory: course?.category
              };
            });
            this.enrollments.set(mapped);
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
