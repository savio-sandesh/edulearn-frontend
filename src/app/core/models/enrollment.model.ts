export interface Enrollment {
  enrollmentId: number;
  studentId: number;
  courseId: number;
  enrolledAt: string;
  progress: number; // 0-100 percentage
  isCompleted: boolean;
  completedAt?: string;
  hasCertificate: boolean;
  // joined from Course API for display
  courseTitle?: string;
  courseThumbnailUrl?: string;
  courseCategory?: string;
}

export interface EnrollmentCheckResult {
  studentId: number;
  courseId: number;
  isEnrolled: boolean;
}

export interface LessonProgress {
  lessonProgressId: number;
  studentId: number;
  lessonId: number;
  courseId: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface Certificate {
  certificateId: number;
  studentId: number;
  courseId: number;
  issuedAt: string;
  studentName?: string;
  courseTitle?: string;
}
