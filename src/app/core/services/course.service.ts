import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.get<Course[]>(this.base, { params });
  }

  /** Fetch a single course by ID. */
  getById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.base}/${id}`);
  }

  /** Fetch all courses by a specific instructor. */
  getByInstructor(instructorId: number): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.base}/instructor/${instructorId}`);
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

  /** Upload or replace a course thumbnail. */
  uploadThumbnail(id: number, file: File): Observable<{ thumbnailUrl: string }> {
    const form = new FormData();
    form.append('thumbnail', file);
    return this.http.post<{ thumbnailUrl: string }>(`${this.base}/${id}/thumbnail`, form);
  }

  // ── Reviews ───────────────────────────────────────────────

  /** Get all reviews for a course. */
  getReviews(courseId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/${courseId}/reviews`);
  }

  /** Submit a review for a course. */
  addReview(courseId: number, dto: ReviewCreateRequest): Observable<Review> {
    return this.http.post<Review>(`${this.base}/${courseId}/reviews`, dto);
  }

  /** Delete a review. */
  deleteReview(courseId: number, reviewId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${courseId}/reviews/${reviewId}`);
  }
}
