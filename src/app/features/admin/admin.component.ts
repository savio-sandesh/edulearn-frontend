import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CourseService } from '../../core/services/course.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Course, User } from '../../core/models';
import { SlicePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

type Tab = 'dashboard' | 'users' | 'approvals';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [SlicePipe, DatePipe, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private readonly courseSvc = inject(CourseService);
  readonly authSvc = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly pendingCourses = signal<Course[]>([]);
  readonly pendingDeleteCourses = signal<Course[]>([]);
  readonly allCourses = signal<Course[]>([]);
  readonly users = signal<User[]>([]);
  readonly categories = signal<string[]>([]);
  
  readonly loading = signal(true);
  
  // Navigation State
  readonly activeTab = signal<Tab>('dashboard');
  
  // Dashboard computed stats
  readonly totalCourses = computed(() => this.allCourses().length);
  readonly pendingCount = computed(() => this.pendingCourses().length);
  readonly pendingDeleteCount = computed(() => this.pendingDeleteCourses().length);
  readonly totalUsers = computed(() => this.users().length);
  
  // Chart computed states
  readonly coursesByCategory = computed(() => {
    const counts: Record<string, number> = {};
    // Initialize all backend categories with 0
    this.categories().forEach(cat => counts[cat] = 0);
    // Count actual courses
    this.allCourses().forEach(c => {
      if (counts[c.category] !== undefined) {
        counts[c.category]++;
      } else {
        counts[c.category] = 1;
      }
    });
    return counts;
  });

  readonly userRoles = computed(() => {
    const roles: Record<string, number> = { 'STUDENT': 0, 'INSTRUCTOR': 0, 'ADMIN': 0 };
    this.users().forEach(u => roles[u.role]++);
    return roles;
  });

  // User Management
  userSearch = signal('');
  readonly filteredUsers = computed(() => {
    const q = this.userSearch().toLowerCase();
    return this.users().filter(u => 
      !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  // Approvals view
  approvalTab = signal<'Pending Approval' | 'Pending Delete'>('Pending Approval');
  readonly filteredCourses = computed(() => {
    const tab = this.approvalTab();
    if (tab === 'Pending Approval') return this.pendingCourses();
    if (tab === 'Pending Delete') return this.pendingDeleteCourses();
    return this.pendingCourses();
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);
    
    // Fetch Everything in parallel
    forkJoin({
      pending: this.courseSvc.getPending(),
      pendingDelete: this.courseSvc.getPendingDelete(),
      courses: this.courseSvc.getAll(),
      students: this.authSvc.getUsersByRole('STUDENT'),
      instructors: this.authSvc.getUsersByRole('INSTRUCTOR'),
      admins: this.authSvc.getUsersByRole('ADMIN'),
      categories: this.courseSvc.getCategories()
    }).subscribe({
      next: (data) => {
        this.pendingCourses.set(data.pending);
        this.pendingDeleteCourses.set(data.pendingDelete);
        this.allCourses.set(data.courses);
        this.users.set([...data.students, ...data.instructors, ...data.admins]);
        this.categories.set(data.categories);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
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

  approveDelete(course: Course): void {
    this.courseSvc.delete(course.courseId).subscribe({
      next: () => {
        this.toast.success(`Course "${course.title}" has been deleted.`);
        this.pendingDeleteCourses.update(courses => courses.filter(c => c.courseId !== course.courseId));
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to delete course.')
    });
  }

  rejectDelete(course: Course): void {
    this.courseSvc.rejectDelete(course.courseId).subscribe({
      next: () => {
        this.toast.info(`Course delete request for "${course.title}" rejected.`);
        this.pendingDeleteCourses.update(courses => courses.filter(c => c.courseId !== course.courseId));
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to reject delete request.')
    });
  }

  // --- User Management Actions ---

  toggleUserStatus(user: User): void {
    if (confirm(`Are you sure you want to ${user.isActive ? 'block' : 'unblock'} ${user.fullName}?`)) {
      this.authSvc.toggleUserStatus(user.userId).subscribe({
        next: () => {
          this.toast.success(`User ${user.fullName} has been ${user.isActive ? 'blocked' : 'unblocked'}.`);
          this.users.update(users => users.map(u => 
            u.userId === user.userId ? { ...u, isActive: !u.isActive } : u
          ));
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to update user status.')
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.fullName}? This will deactivate their account.`)) {
      this.authSvc.deleteUser(user.userId).subscribe({
        next: () => {
          this.toast.success(`User ${user.fullName} has been deleted (deactivated).`);
          this.users.update(users => users.map(u => 
            u.userId === user.userId ? { ...u, isActive: false } : u
          ));
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to delete user.')
      });
    }
  }
}
