// ── Quiz Question (used by instructor builder in learn/quiz components) ──────

/** Option shape used in the standalone quiz.component (old dedicated quiz page) */
export interface QuizOption {
  optionId: string; // "A", "B", "C", "D"
  text: string;
}

/** Question shape used by quiz.component (standalone quiz page) */
export interface Question {
  questionId: number;
  text: string;
  options: QuizOption[];
  /** Only present after submission — not sent to students during attempt */
  correctAnswer?: string;
}

/** Question shape used by learn.component's inline quiz panel builder */
export interface QuizQuestion {
  id: number;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
}

// ── Quiz (returned from Assessment API) ──────────────────────────────────────

/** The Quiz object returned from the backend */
export interface Quiz {
  quizId: number;
  courseId: number;
  lessonId?: number | null;
  title: string;
  description: string;   // stores question content JSON (array of QuizQuestion without correctOptionId)
  timeLimitMinutes: number;
  passingScore: number;
  maxAttempts: number;
  isPublished: boolean;
  questionsJson: string; // raw JSON: { [questionId]: correctOptionId } — graded server-side
  createdAt: string;

  /** Populated client-side after parsing description; NOT from the API */
  questions?: Question[];
}

// ── Attempt ──────────────────────────────────────────────────────────────────

/** A student's quiz attempt result */
export interface QuizAttempt {
  attemptId: number;
  quizId: number;
  studentId: number;
  score: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt?: string;
  answers: string; // raw JSON string from backend: { questionId: selectedOptionId }
}

/** Request to submit answers (learn page inline panel) */
export interface SubmitAttemptRequest {
  answers: Record<number, string>; // { questionId: selectedOptionId }
}

/** Attempt count result */
export interface AttemptCountResult {
  quizId: number;
  studentId: number;
  attemptCount: number;
}
