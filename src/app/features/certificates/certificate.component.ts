import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { ToastService } from '../../core/services/toast.service';
import { Certificate } from '../../core/models';
import { DatePipe, DecimalPipe, SlicePipe } from '@angular/common';

@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, SlicePipe],
  templateUrl: './certificate.component.html',
  styleUrl: './certificate.component.scss'
})
export class CertificateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly enrollSvc = inject(EnrollmentService);
  private readonly toast = inject(ToastService);

  readonly certificate = signal<Certificate | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    const courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.enrollSvc.getCertificate(courseId).subscribe({
      next: (cert) => {
        this.certificate.set(cert);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
        this.toast.error('Certificate not found or course not completed.');
      }
    });
  }

  printCertificate(): void {
    window.print();
  }
}
