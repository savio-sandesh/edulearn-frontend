import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Course, CourseCreateRequest, CourseUpdateRequest, Review, ReviewCreateRequest } from '../models';

export interface CourseFilters {
  search?:    string;
  category?:  string;
  level?:     string;
  language?:  string;
  minPrice?:  number;
  maxPrice?:  number;
  page?:      number;
  pageSize?:  number;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);
  private readonly baseApi = `${environment.apis.course}/api`;
  private readonly base = `${environment.apis.course}/api/courses`;

  /** Fetch all courses, with optional search/filter/pagination. */
  getAll(filters?: CourseFilters): Observable<Course[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params = params.set(key, String(val));
        }
      });
    }
    return this.http.get<Course[]>(`${this.base}/published`, { params });
  }

  /** Fetch a single course by ID. */
  getById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.base}/${id}`);
  }

  /** Fetch all courses by a specific instructor. */
  getByInstructor(instructorId: number): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.base}/byInstructor/${instructorId}`);
  }

  /** Fetch all available categories from the backend. */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseApi}/categories`);
  }

  /** Create a new course (instructor/admin only). */
  create(dto: CourseCreateRequest): Observable<Course> {
    return this.http.post<Course>(this.base, dto);
  }

  /** Update an existing course. */
  update(id: number, dto: CourseUpdateRequest): Observable<Course> {
    return this.http.put<Course>(`${this.base}/${id}`, dto);
  }

  /** Delete a course. */
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  /** Publish a course (Sends to Admin for approval). */
  publish(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/publish/${id}`, {});
  }

  uploadThumbnail(id: number, file: File): Observable<Course> {
    const form = new FormData();
    form.append('File', file);
    return this.http.post<Course>(`${this.base}/${id}/thumbnail`, form);
  }

  // ── Reviews ───────────────────────────────────────────────

  /** Get all reviews for a course. */
  getReviews(courseId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/${courseId}/reviews`);
  }

  /** Submit a review for a course. */
  addReview(courseId: number, dto: ReviewCreateRequest): Observable<Review> {
    const payload = { ...dto, courseId };
    return this.http.post<Review>(`${this.baseApi}/reviews`, payload);
  }

  /** Delete a review. */
  deleteReview(courseId: number, reviewId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${courseId}/reviews/${reviewId}`);
  }

  /** Increment enrollment count. */
  incrementEnrollment(courseId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/${courseId}/enrollments/increment`, {});
  }

  // --- Admin Endpoints ---

  /** Get all courses pending approval. (Admin only) */
  getPending(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.base}/pending`);
  }

  /** Get all courses pending deletion. (Admin only) */
  getPendingDelete(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.base}/pending-delete`);
  }

  /** Approve a course for publishing. (Admin only) */
  approve(courseId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/approve/${courseId}`, {});
  }

  /** Reject a course from publishing. (Admin only) */
  reject(courseId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/reject/${courseId}`, {});
  }

  /** Reject a course deletion request. (Admin only) */
  rejectDelete(courseId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/reject-delete/${courseId}`, {});
  }
}
