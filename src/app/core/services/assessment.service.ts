import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Quiz, QuizCreateRequest, QuizAttempt,
  SubmitAttemptRequest, AttemptCountResult,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apis.assessment}/api`;

  // ── Quizzes ────────────────────────────────────────────

  /** Get a quiz with its questions for a given lesson. */
  getQuizByLesson(lessonId: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.base}/quizzes/lesson/${lessonId}`);
  }

  /** Get a quiz directly by its ID (with questions). */
  getQuizById(quizId: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.base}/quizzes/${quizId}`);
  }

  /** Get all quizzes for a course (instructor view). */
  getQuizzesByCourse(courseId: number): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.base}/quizzes/course/${courseId}`);
  }

  /** Create a quiz (instructor only). */
  createQuiz(dto: QuizCreateRequest): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.base}/quizzes`, dto);
  }

  /** Delete a quiz. */
  deleteQuiz(quizId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/quizzes/${quizId}`);
  }

  // ── Attempts ───────────────────────────────────────────

  /** Submit answers for a quiz attempt. Returns graded result. */
  submitAttempt(quizId: number, dto: SubmitAttemptRequest): Observable<QuizAttempt> {
    return this.http.post<QuizAttempt>(`${this.base}/attempts/quiz/${quizId}`, dto);
  }

  /** Get all past attempts for a quiz by the current user. */
  getMyAttempts(quizId: number): Observable<QuizAttempt[]> {
    return this.http.get<QuizAttempt[]>(`${this.base}/attempts/quiz/${quizId}/my`);
  }

  /** Get how many attempts the current user has used on this quiz. */
  getAttemptCount(quizId: number): Observable<AttemptCountResult> {
    return this.http.get<AttemptCountResult>(`${this.base}/attempts/quiz/${quizId}/count`);
  }
}
