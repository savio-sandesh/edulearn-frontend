export interface QuizOption {
  optionId: string; // e.g. "A", "B", "C", "D"
  text: string;
}

export interface Question {
  questionId: number;
  text: string;
  options: QuizOption[];
  // correctAnswer not sent to students — only after submission
  correctAnswer?: string;
}

export interface Quiz {
  quizId: number;
  courseId: number;
  lessonId: number;
  title: string;
  description: string;
  passingScore: number; // e.g. 70 (percent)
  maxAttempts: number;
  isPublished: boolean;
  questions: Question[];
}

export interface QuizCreateRequest {
  courseId: number;
  lessonId: number;
  title: string;
  description: string;
  passingScore: number;
  maxAttempts: number;
  questions: Question[];
}

export interface QuizAttempt {
  attemptId: number;
  quizId: number;
  studentId: number;
  score: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt?: string;
  answers: Record<string, string>; // { questionId: selectedOptionId }
}

export interface SubmitAttemptRequest {
  answers: Record<string, string>;
}

export interface AttemptCountResult {
  quizId: number;
  studentId: number;
  attemptCount: number;
}
