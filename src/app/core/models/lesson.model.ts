export interface Lesson {
  lessonId: number;
  courseId: number;
  title: string;
  description: string;
  contentType: string;
  contentUrl: string;
  order: number;
  isPublished: boolean;
  isPreview: boolean;
  durationMinutes: number;
}

export interface LessonCreateRequest {
  courseId: number;
  title: string;
  description: string;
  contentType: string;
  contentUrl: string;
  durationMinutes: number;
  isPreview: boolean;
}

export interface LessonUpdateRequest {
  title: string;
  description: string;
  contentType: string;
  contentUrl: string;
  durationMinutes: number;
  isPreview: boolean;
}

export interface ReorderLessonsRequest {
  orderedLessonIds: number[];
}
