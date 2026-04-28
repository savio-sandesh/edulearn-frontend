export interface Lesson {
  lessonId: number;
  courseId: number;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
  isPublished: boolean;
  isPreview: boolean;
  duration: number; // in minutes
}

export interface LessonCreateRequest {
  courseId: number;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
  isPreview: boolean;
  duration: number;
}

export interface LessonUpdateRequest {
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
  isPreview: boolean;
  duration: number;
}

export interface ReorderLessonsRequest {
  orderedLessonIds: number[];
}
