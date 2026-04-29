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
  readonly allCourses = signal<Course[]>([]);
  readonly users = signal<User[]>([]);
  readonly categories = signal<string[]>([]);
  
  readonly loading = signal(true);
  
  // Navigation State
  readonly activeTab = signal<Tab>('dashboard');
  
  // Dashboard computed stats
  readonly totalCourses = computed(() => this.allCourses().length);
  readonly pendingCount = computed(() => this.pendingCourses().length);
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
  approvalTab = signal<'All' | 'Pending' | 'Published' | 'Rejected'>('All');
  readonly filteredCourses = computed(() => {
    // For now we only track pending locally to match previous behavior, 
    // but published courses are available in allCourses.
    const tab = this.approvalTab();
    if (tab === 'Pending') return this.pendingCourses();
    if (tab === 'Published') return this.allCourses();
    // Default show pending in approvals view if 'All' is selected, plus published?
    // Let's just show pending courses when they switch to approvals like the old view for simplicity,
    // or merge all if "All" is selected.
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
      courses: this.courseSvc.getAll(),
      students: this.authSvc.getUsersByRole('STUDENT'),
      instructors: this.authSvc.getUsersByRole('INSTRUCTOR'),
      admins: this.authSvc.getUsersByRole('ADMIN'),
      categories: this.courseSvc.getCategories()
    }).subscribe({
      next: (data) => {
        this.pendingCourses.set(data.pending);
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
