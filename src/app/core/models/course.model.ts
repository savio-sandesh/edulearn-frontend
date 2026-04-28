export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type CourseStatus = 'Draft' | 'PendingApproval' | 'Published' | 'Rejected';

export interface Course {
  courseId: number;
  title: string;
  description: string;
  instructorId: number;
  instructorName?: string;
  category: string;
  level: string;
  language: string;
  price: number;
  thumbnailUrl?: string;
  isPublished: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  totalDuration: number;
  enrollmentCount: number;
  averageRating?: number;
}

export interface CourseCreateRequest {
  title: string;
  description: string;
  category: string;
  level: string;
  language: string;
  price: number;
}

export interface CourseUpdateRequest {
  title: string;
  description: string;
  category: string;
  level: string;
  language: string;
  price: number;
}

export interface Review {
  reviewId: number;
  courseId: number;
  studentId: number;
  studentName?: string;
  studentAvatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewCreateRequest {
  rating: number;
  comment: string;
}
