import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Quiz, QuizAttempt, SubmitAttemptRequest, AttemptCountResult } from '../models';

/** Payload sent when creating or updating a quiz. */
export interface QuizCreatePayload {
  courseId: number;
  lessonId?: number | null;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScore: number;
  maxAttempts: number;
  /** JSON string of { [questionId: number]: correctOptionId } */
  questionsJson: string;
}

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apis.assessment}`;

  // ── Instructor: Quiz CRUD ──────────────────────────────

  /** Get all quizzes for a course (instructor view). */
  getQuizzesByCourse(courseId: number): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.base}/byCourse/${courseId}`);
  }

  /** Get a quiz by lesson (used in learn page). */
  getQuizByLesson(lessonId: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.base}/byLesson/${lessonId}`);
  }

  /** Get a quiz by id. */
  getQuizById(quizId: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.base}/${quizId}`);
  }

  /** Create a quiz (instructor only). */
  createQuiz(payload: QuizCreatePayload): Observable<Quiz> {
    return this.http.post<Quiz>(this.base, payload);
  }

  /** Update a quiz. */
  updateQuiz(quizId: number, payload: QuizCreatePayload): Observable<Quiz> {
    return this.http.put<Quiz>(`${this.base}/${quizId}`, payload);
  }

  /** Publish a quiz so students can take it. */
  publishQuiz(quizId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/publish/${quizId}`, {});
  }

  /** Delete a quiz. */
  deleteQuiz(quizId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${quizId}`);
  }

  // ── Student: Attempts ─────────────────────────────────

  /** Start a new attempt for a quiz. Returns attempt object with attemptId. */
  startAttempt(quizId: number): Observable<QuizAttempt> {
    return this.http.post<QuizAttempt>(`${this.base}/${quizId}/startAttempt`, {});
  }

  /** Submit answers for an in-progress attempt. Returns graded result. */
  submitAttempt(attemptId: number, dto: SubmitAttemptRequest): Observable<QuizAttempt> {
    return this.http.post<QuizAttempt>(`${this.base}/attempts/${attemptId}/submit`, dto);
  }

  /** Get all past attempts for a quiz by the current student. */
  getMyAttempts(quizId: number): Observable<QuizAttempt[]> {
    return this.http.get<QuizAttempt[]>(`${this.base}/${quizId}/attempts`);
  }

  /** Get best attempt score for a quiz by current student. */
  getBestAttempt(quizId: number): Observable<QuizAttempt> {
    return this.http.get<QuizAttempt>(`${this.base}/${quizId}/bestAttempt`);
  }

  /** Get how many attempts the current student has used. */
  getAttemptCount(quizId: number): Observable<AttemptCountResult> {
    return this.http.get<AttemptCountResult>(`${this.base}/${quizId}/attemptCount`);
  }
}
