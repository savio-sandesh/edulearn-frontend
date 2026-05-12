import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Enrollment, EnrollmentCheckResult, LessonProgress, Certificate } from '../models';
import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly authSvc = inject(AuthService);
  private readonly base = `${environment.apis.enrollment}`;
  private readonly progressBase = `${environment.apis.progress}`;

  /** Enroll the authenticated user in a course. */
  enroll(courseId: number): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.base}/enroll/${courseId}`, {});
  }

  /** Check whether the current user is enrolled in a course. */
  checkEnrollment(courseId: number): Observable<EnrollmentCheckResult> {
    return this.http.get<EnrollmentCheckResult>(`${this.base}/isEnrolled/${courseId}`);
  }

  /** Get all enrollments for the authenticated user. */
  getMyEnrollments(): Observable<Enrollment[]> {
    const userId = this.authSvc.currentUser()?.userId;
    if (!userId) return of([]);
    return this.http.get<Enrollment[]>(`${this.base}/byStudent/${userId}`);
  }

  /** Get enrollments for a specific student (admin/instructor). */
  getByStudent(studentId: number): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.base}/byStudent/${studentId}`);
  }

  /** Get all enrollments for a course (instructor/admin). */
  getByCourse(courseId: number): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.base}/byCourse/${courseId}`);
  }

  /** Mark a lesson as complete for the current user. */
  completeLesson(lessonId: number, courseId: number): Observable<LessonProgress> {
    const studentId = this.authSvc.currentUser()?.userId;
    if (!studentId) return of({} as LessonProgress);
    return this.http.post<LessonProgress>(`${this.progressBase}/mark-complete`, { 
      studentId, 
      courseId, 
      lessonId, 
      isCompleted: true 
    });
  }

  /** Update course progress in the enrollment database. */
  updateCourseProgress(courseId: number): Observable<Enrollment> {
    return this.http.put<Enrollment>(`${this.base}/progress/byCourse/${courseId}`, {});
  }

  /** Get lesson progress for a course. */
  getLessonProgress(courseId: number): Observable<LessonProgress[]> {
    const studentId = this.authSvc.currentUser()?.userId;
    if (!studentId) return of([]);
    return this.http.get<LessonProgress[]>(`${this.progressBase}/lesson-progress?courseId=${courseId}&studentId=${studentId}`);
  }

  /** Mark a course as complete and trigger certificate generation. */
  completeCourse(courseId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/complete/${courseId}`, {});
  }

  /** Issue a certificate for a completed course. */
  issueCertificate(enrollmentId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/issueCert/${enrollmentId}`, {});
  }

  /** Get the certificate for a completed course. */
  getCertificate(courseId: number): Observable<Certificate> {
    const studentId = this.authSvc.currentUser()?.userId;
    if (!studentId) return of({} as Certificate);
    return this.http.get<Certificate[]>(`${this.progressBase}/certificates?studentId=${studentId}&courseId=${courseId}`).pipe(
      map(certs => certs && certs.length > 0 ? certs[0] : null as any)
    );
  }
}
