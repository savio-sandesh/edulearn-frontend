import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Enrollment, EnrollmentCheckResult, LessonProgress, Certificate } from '../models';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apis.enrollment}/api/enrollments`;

  /** Enroll the authenticated user in a course. */
  enroll(courseId: number): Observable<Enrollment> {
    return this.http.post<Enrollment>(this.base, { courseId });
  }

  /** Check whether the current user is enrolled in a course. */
  checkEnrollment(courseId: number): Observable<EnrollmentCheckResult> {
    return this.http.get<EnrollmentCheckResult>(`${this.base}/check/${courseId}`);
  }

  /** Get all enrollments for the authenticated user. */
  getMyEnrollments(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.base}/my`);
  }

  /** Get enrollments for a specific student (admin/instructor). */
  getByStudent(studentId: number): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.base}/student/${studentId}`);
  }

  /** Get all enrollments for a course (instructor/admin). */
  getByCourse(courseId: number): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.base}/course/${courseId}`);
  }

  /** Mark a lesson as complete for the current user. */
  completeLesson(lessonId: number, courseId: number): Observable<LessonProgress> {
    return this.http.post<LessonProgress>(`${this.base}/progress`, { lessonId, courseId });
  }

  /** Get lesson progress for a course. */
  getLessonProgress(courseId: number): Observable<LessonProgress[]> {
    return this.http.get<LessonProgress[]>(`${this.base}/progress/${courseId}`);
  }

  /** Mark a course as complete and trigger certificate generation. */
  completeCourse(courseId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/complete/${courseId}`, {});
  }

  /** Get the certificate for a completed course. */
  getCertificate(courseId: number): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.base}/certificate/${courseId}`);
  }
}
