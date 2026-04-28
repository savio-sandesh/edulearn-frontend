import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Lesson, LessonCreateRequest, LessonUpdateRequest, ReorderLessonsRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apis.content}/api/lessons`;

  /** Get all published lessons for a course, sorted by order. */
  getLessons(courseId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.base}/course/${courseId}`);
  }

  /** Get a single lesson by ID. */
  getLesson(lessonId: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.base}/${lessonId}`);
  }

  /** Create a new lesson (instructor only). */
  createLesson(dto: LessonCreateRequest): Observable<Lesson> {
    return this.http.post<Lesson>(this.base, dto);
  }

  /** Update an existing lesson. */
  updateLesson(lessonId: number, dto: LessonUpdateRequest): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.base}/${lessonId}`, dto);
  }

  /** Delete a lesson. */
  deleteLesson(lessonId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${lessonId}`);
  }

  /** Reorder lessons within a course. */
  reorderLessons(courseId: number, dto: ReorderLessonsRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/course/${courseId}/reorder`, dto);
  }
}
