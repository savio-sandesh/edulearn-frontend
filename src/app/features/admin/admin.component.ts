import { Component, OnInit, inject, signal } from '@angular/core';
import { CourseService } from '../../core/services/course.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Course } from '../../core/models';
import { DecimalPipe, SlicePipe } from '@angular/common';

type Tab = 'dashboard' | 'approvals';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DecimalPipe, SlicePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private readonly courseSvc = inject(CourseService);
  readonly authSvc = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly pendingCourses = signal<Course[]>([]);
  readonly loading = signal(true);
  
  // Navigation State
  readonly activeTab = signal<Tab>('approvals');
  
  ngOnInit(): void {
    this.loadPendingCourses();
  }

  loadPendingCourses(): void {
    this.loading.set(true);
    this.courseSvc.getPending().subscribe({
      next: (data) => {
        this.pendingCourses.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  setTab(tab: Tab): void {
    if (tab === 'dashboard') {
      this.toast.info(`${tab} section is coming soon!`);
      return;
    }
    this.activeTab.set(tab);
    if (tab === 'approvals') {
      this.loadPendingCourses();
    }
  }

  approveCourse(course: Course): void {
    this.courseSvc.approve(course.courseId).subscribe({
      next: () => {
        this.toast.success(`Course "${course.title}" approved successfully.`);
        this.pendingCourses.update(courses => courses.filter(c => c.courseId !== course.courseId));
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to approve course.')
    });
  }

  rejectCourse(course: Course): void {
    this.courseSvc.reject(course.courseId).subscribe({
      next: () => {
        this.toast.info(`Course "${course.title}" rejected and returned to instructor.`);
        this.pendingCourses.update(courses => courses.filter(c => c.courseId !== course.courseId));
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to reject course.')
    });
  }
}
