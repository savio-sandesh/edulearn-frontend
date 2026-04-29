import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../core/services/course.service';
import { ContentService } from '../../core/services/content.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Course, CourseCreateRequest, Lesson, LessonCreateRequest } from '../../core/models';
import { DecimalPipe, SlicePipe } from '@angular/common';

type Tab = 'dashboard' | 'courses' | 'create' | 'edit' | 'analytics' | 'revenue' | 'lessons';

@Component({
  selector: 'app-instructor',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, SlicePipe],
  templateUrl: './instructor.component.html',
  styleUrl: './instructor.component.scss'
})
export class InstructorComponent implements OnInit {
  private readonly courseSvc = inject(CourseService);
  private readonly contentSvc = inject(ContentService);
  readonly authSvc = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly courses = signal<Course[]>([]);
  readonly categories = signal<string[]>(['Web Development']);
  readonly loading = signal(true);
  
  // Navigation State
  readonly activeTab = signal<Tab>('dashboard');
  
  // Computed Stats
  readonly totalStudents = computed(() => this.courses().reduce((sum, c) => sum + c.enrollmentCount, 0));
  readonly totalRevenue = computed(() => this.courses().reduce((sum, c) => sum + (c.enrollmentCount * c.price), 0));
  readonly averageRating = computed(() => {
    const rated = this.courses().filter(c => c.averageRating && c.averageRating > 0);
    if (!rated.length) return 0;
    const sum = rated.reduce((acc, c) => acc + (c.averageRating || 0), 0);
    return sum / rated.length;
  });

  // Create Course Wizard State
  readonly wizardStep = signal<1 | 2>(1);
  readonly submitting = signal(false);
  thumbnailFile: File | null = null;

  readonly courseForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    category: ['', Validators.required],
    level: ['BEGINNER', Validators.required],
    language: ['English', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
  });

  // Edit Course State
  readonly editingCourse = signal<Course | null>(null);
  readonly submittingEdit = signal(false);
  editThumbnailFile: File | null = null;

  readonly editCourseForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    category: ['', Validators.required],
    level: ['BEGINNER', Validators.required],
    language: ['English', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
  });

  // Lesson Builder State
  readonly selectedCourse = signal<Course | null>(null);
  readonly courseLessons = signal<Lesson[]>([]);
  readonly submittingLesson = signal(false);
  videoFile: File | null = null;

  readonly lessonForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    contentType: ['Video', Validators.required],
    durationMinutes: [5, [Validators.required, Validators.min(1)]],
    isPreview: [false]
  });

  ngOnInit(): void {
    this.loadCourses();
    this.loadCategories();
  }

  loadCategories(): void {
    this.courseSvc.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        if (cats.length > 0) {
          this.courseForm.patchValue({ category: cats[0] });
        }
      },
      error: () => console.warn('Could not load categories.')
    });
  }

  loadCourses(): void {
    this.loading.set(true);
    const user = this.authSvc.currentUser();
    if (user?.userId) {
      this.courseSvc.getByInstructor(user.userId).subscribe({
        next: (data) => {
          this.courses.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  setTab(tab: Tab): void {
    if (tab === 'revenue') {
      this.toast.info(`${tab} section is coming soon!`);
      return;
    }
    this.activeTab.set(tab);
    if (tab === 'create') {
      this.wizardStep.set(1);
      this.courseForm.reset({ category: this.categories()[0] || '', level: 'BEGINNER', language: 'English', price: 0 });
    }
  }

  manageLessons(course: Course): void {
    this.selectedCourse.set(course);
    this.activeTab.set('lessons');
    this.loadLessons(course.courseId);
  }

  loadLessons(courseId: number): void {
    this.contentSvc.getLessons(courseId).subscribe({
      next: (lessons) => this.courseLessons.set(lessons),
      error: () => this.toast.error('Failed to load lessons.')
    });
  }

  onThumbnailSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.thumbnailFile = file;
    }
  }

  onEditThumbnailSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.editThumbnailFile = file;
    }
  }

  onVideoSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.videoFile = file;
    }
  }

  submitLesson(): void {
    if (this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      this.toast.error('Please complete all required fields.');
      return;
    }

    const course = this.selectedCourse();
    if (!course) return;

    if (!this.videoFile) {
      this.toast.error('Please select a video file to upload.');
      return;
    }

    this.submittingLesson.set(true);

    // 1. Upload Video First
    this.contentSvc.uploadVideo(this.videoFile).subscribe({
      next: (res) => {
        // 2. Create Lesson with the returned URL
        const payload: LessonCreateRequest = {
          ...this.lessonForm.value,
          contentUrl: res.url,
          courseId: course.courseId
        } as LessonCreateRequest;

        this.contentSvc.createLesson(payload).subscribe({
          next: (newLesson) => {
            this.toast.success('Lesson and video added successfully!');
            this.submittingLesson.set(false);
            this.courseLessons.update(lessons => [...lessons, newLesson]);
            this.lessonForm.reset({ contentType: 'Video', durationMinutes: 5, isPreview: false });
            this.videoFile = null;
          },
          error: (err: any) => {
            this.submittingLesson.set(false);
            this.toast.error(err.error?.message || 'Failed to add lesson.');
          }
        });
      },
      error: (err: any) => {
        this.submittingLesson.set(false);
        this.toast.error(err.error?.message || 'Failed to upload video to Azure Blob Storage.');
      }
    });
  }

  nextStep(): void {
    if (this.courseForm.get('title')?.invalid || this.courseForm.get('description')?.invalid) {
      this.courseForm.markAllAsTouched();
      this.toast.error('Please complete the required basic info.');
      return;
    }
    this.wizardStep.set(2);
  }

  prevStep(): void {
    this.wizardStep.set(1);
  }

  submitCourse(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      this.toast.error('Please complete all fields.');
      return;
    }

    this.submitting.set(true);
    const payload: CourseCreateRequest = this.courseForm.value as CourseCreateRequest;

    this.courseSvc.create(payload).subscribe({
      next: (course) => {
        if (this.thumbnailFile) {
          this.courseSvc.uploadThumbnail(course.courseId, this.thumbnailFile).subscribe({
            next: () => {
              this.toast.success('Course and thumbnail created successfully!');
              this.finalizeCourseCreation();
            },
            error: () => {
              this.toast.error('Course created, but thumbnail upload failed.');
              this.finalizeCourseCreation();
            }
          });
        } else {
          this.toast.success('Course created successfully!');
          this.finalizeCourseCreation();
        }
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.toast.error(err.error?.message || 'Failed to create course.');
      }
    });
  }

  private finalizeCourseCreation(): void {
    this.submitting.set(false);
    this.thumbnailFile = null;
    this.loadCourses();
    this.activeTab.set('courses');
  }

  editCourse(course: Course): void {
    this.editingCourse.set(course);
    this.editCourseForm.patchValue({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      language: course.language,
      price: course.price
    });
    this.editThumbnailFile = null;
    this.activeTab.set('edit');
  }

  submitEditCourse(): void {
    if (this.editCourseForm.invalid) {
      this.editCourseForm.markAllAsTouched();
      this.toast.error('Please complete all required fields.');
      return;
    }

    const course = this.editingCourse();
    if (!course) return;

    this.submittingEdit.set(true);
    const payload = this.editCourseForm.value as any;

    this.courseSvc.update(course.courseId, payload).subscribe({
      next: () => {
        if (this.editThumbnailFile) {
          this.courseSvc.uploadThumbnail(course.courseId, this.editThumbnailFile).subscribe({
            next: () => {
              this.toast.success('Course updated successfully with new thumbnail!');
              this.finalizeCourseEdit();
            },
            error: () => {
              this.toast.error('Course updated, but thumbnail upload failed.');
              this.finalizeCourseEdit();
            }
          });
        } else {
          this.toast.success('Course updated successfully!');
          this.finalizeCourseEdit();
        }
      },
      error: (err: any) => {
        this.submittingEdit.set(false);
        this.toast.error(err.error?.message || 'Failed to update course.');
      }
    });
  }

  private finalizeCourseEdit(): void {
    this.submittingEdit.set(false);
    this.editThumbnailFile = null;
    this.editingCourse.set(null);
    this.loadCourses();
    this.activeTab.set('courses');
  }

  onAction(action: string): void {
    this.toast.info(`${action} will be available in the next major update!`);
  }

  publishCourse(course: Course): void {
    if (confirm(`Are you sure you want to publish "${course.title}"? It will be sent to Admins for approval.`)) {
      this.courseSvc.publish(course.courseId).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Course sent for approval!');
          this.loadCourses(); // reload to update status
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to publish course. Ensure you have added lessons first!');
        }
      });
    }
  }
}
