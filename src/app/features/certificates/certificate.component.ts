import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { CourseService } from '../../core/services/course.service';
import { Certificate } from '../../core/models';
import { DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './certificate.component.html',
  styleUrl: './certificate.component.scss'
})
export class CertificateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly enrollSvc = inject(EnrollmentService);
  private readonly toast = inject(ToastService);

  private readonly authSvc = inject(AuthService);
  private readonly courseSvc = inject(CourseService);

  readonly certificate = signal<any | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    const courseId = Number(this.route.snapshot.paramMap.get('id'));
    
    // Fetch certificate, course, and user info concurrently
    forkJoin({
      cert: this.enrollSvc.getCertificate(courseId),
      course: this.courseSvc.getById(courseId)
    }).subscribe({
      next: ({cert, course}) => {
        if (!cert) {
          // If the cert doesn't exist yet but they reached here, they might be an older user.
          // Let's automatically trigger the generation for them.
          this.enrollSvc.getMyEnrollments().subscribe({
            next: (enrollments: any[]) => {
              const currentEnrollment = enrollments.find((e: any) => e.courseId === courseId);
              if (currentEnrollment) {
                this.toast.info('Generating your certificate, please wait a moment...');
                this.enrollSvc.issueCertificate(currentEnrollment.enrollmentId).subscribe({
                  next: () => {
                    setTimeout(() => window.location.reload(), 2000); // Reload after brief wait
                  },
                  error: () => {
                    this.error.set(true);
                    this.loading.set(false);
                    this.toast.error('Failed to generate certificate.');
                  }
                });
              } else {
                this.error.set(true);
                this.loading.set(false);
                this.toast.error('Certificate not found.');
              }
            },
            error: () => {
              this.error.set(true);
              this.loading.set(false);
              this.toast.error('Certificate is still being generated or does not exist.');
            }
          });
        } else {
          const user = this.authSvc.currentUser();
          this.certificate.set({
            ...cert,
            certificateId: (cert as any).id || cert.certificateId,
            studentName: user?.fullName || 'Student',
            courseTitle: course?.title || 'Course'
          });
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.toast.error('Failed to load certificate.');
      }
    });
  }

  printCertificate(): void {
    window.print();
  }
}
