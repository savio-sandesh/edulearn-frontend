import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { AuthService } from '../../core/services/auth.service';
import { Enrollment } from '../../core/models';
import { DatePipe } from '@angular/common';

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
      next: (data) => {
        this.enrollments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
