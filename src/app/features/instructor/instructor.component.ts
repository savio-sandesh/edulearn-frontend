import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CourseService } from '../../core/services/course.service';
import { ContentService } from '../../core/services/content.service';
import { AssessmentService, QuizCreatePayload } from '../../core/services/assessment.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Course, CourseCreateRequest, Lesson, LessonCreateRequest, Quiz, QuizQuestion } from '../../core/models';
import { DecimalPipe, SlicePipe } from '@angular/common';

type Tab = 'dashboard' | 'courses' | 'create' | 'edit' | 'analytics' | 'revenue' | 'lessons' | 'quiz';

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
  private readonly assessmentSvc = inject(AssessmentService);
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
    isPreview: [false],
    articleContent: [''],   // only used when contentType === 'Article'
    linkedQuizId: [null as number | null] // only used when contentType === 'Quiz'
  });

  /** Live character count for the article editor */
  readonly articleCharCount = computed(() =>
    (this.lessonForm.get('articleContent')?.value as string | null)?.length ?? 0
  );

  // Quiz Builder State
  readonly courseQuizzes = signal<Quiz[]>([]);
  readonly submittingQuiz = signal(false);
  readonly publishingQuiz = signal<number | null>(null);
  readonly quizQuestions = signal<QuizQuestion[]>([]);
  private nextQId = 1;

  readonly quizForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    timeLimitMinutes: [10, [Validators.required, Validators.min(1)]],
    passingScore: [70, [Validators.required, Validators.min(1), Validators.max(100)]],
    maxAttempts: [3, [Validators.required, Validators.min(1)]],
    attachToLesson: [false],
    lessonId: [null as number | null]
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
    this.loadQuizzes(course.courseId); // preload quizzes so quiz-type lessons can link them
  }

  loadLessons(courseId: number): void {
    this.contentSvc.getLessons(courseId).subscribe({
      next: (lessons) => this.courseLessons.set(lessons),
      error: () => this.toast.error('Failed to load lessons.')
    });
  }

  /** Called when the Content Type dropdown changes — clears type-specific fields. */
  onContentTypeChange(): void {
    this.lessonForm.patchValue({ articleContent: '', linkedQuizId: null });
    this.videoFile = null;
  }

  /** Jump to Quiz Builder for this course. */
  goToQuizBuilder(): void {
    const course = this.selectedCourse();
    if (course) this.manageQuizzes(course);
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

    const contentType: string = this.lessonForm.value.contentType ?? 'Video';

    // ── VIDEO ──────────────────────────────────────────────────────────────
    if (contentType === 'Video') {
      if (!this.videoFile) {
        this.toast.error('Please select a video file (.mp4) to upload.');
        return;
      }
      this.submittingLesson.set(true);
      this.contentSvc.uploadVideo(this.videoFile).subscribe({
        next: (res) => {
          const payload: LessonCreateRequest = {
            ...this.lessonForm.value,
            contentUrl: res.url,
            courseId: course.courseId
          } as LessonCreateRequest;
          this.contentSvc.createLesson(payload).subscribe({
            next: (newLesson) => {
              this.toast.success('Video lesson added successfully!');
              this.submittingLesson.set(false);
              this.courseLessons.update(l => [...l, newLesson]);
              this.resetLessonForm();
            },
            error: (err: any) => {
              this.submittingLesson.set(false);
              this.toast.error(err.error?.message || 'Failed to add lesson.');
            }
          });
        },
        error: (err: any) => {
          this.submittingLesson.set(false);
          this.toast.error(err.error?.message || 'Failed to upload video.');
        }
      });
      return;
    }

    // ── ARTICLE ────────────────────────────────────────────────────────────
    if (contentType === 'Article') {
      const articleContent = (this.lessonForm.value.articleContent ?? '').trim();
      if (!articleContent) {
        this.toast.error('Please write some article content before saving.');
        return;
      }
      this.submittingLesson.set(true);
      // Backend content type: ARTICLE
      // Article text is stored in description; contentUrl is a placeholder marker
      const payload: LessonCreateRequest = {
        title: this.lessonForm.value.title,
        description: articleContent,          // article body goes here
        contentType: 'ARTICLE',               // backend normalized name
        contentUrl: 'about:article',          // placeholder — no real URL needed
        durationMinutes: this.lessonForm.value.durationMinutes ?? 5,
        isPreview: this.lessonForm.value.isPreview ?? false,
        courseId: course.courseId
      } as LessonCreateRequest;
      this.contentSvc.createLesson(payload).subscribe({
        next: (newLesson) => {
          this.toast.success('Article lesson added successfully!');
          this.submittingLesson.set(false);
          this.courseLessons.update(l => [...l, newLesson]);
          this.resetLessonForm();
        },
        error: (err: any) => {
          this.submittingLesson.set(false);
          this.toast.error(err.error?.message || 'Failed to add article lesson.');
        }
      });
      return;
    }

    // ── QUIZ ───────────────────────────────────────────────────────────────
    if (contentType === 'Quiz') {
      const linkedQuizId = this.lessonForm.value.linkedQuizId;
      if (!linkedQuizId) {
        this.toast.error('Please select a quiz to attach to this lesson.');
        return;
      }
      this.submittingLesson.set(true);
      // Backend content type: QUIZ_LINK
      // Quiz ID stored in description; contentUrl is a placeholder marker
      const payload: LessonCreateRequest = {
        title: this.lessonForm.value.title,
        description: String(linkedQuizId),    // quiz ID for the learn page to look up
        contentType: 'QUIZ_LINK',             // backend normalized name
        contentUrl: `about:quiz-${linkedQuizId}`,  // placeholder marker
        durationMinutes: this.lessonForm.value.durationMinutes ?? 5,
        isPreview: this.lessonForm.value.isPreview ?? false,
        courseId: course.courseId
      } as LessonCreateRequest;
      this.contentSvc.createLesson(payload).subscribe({
        next: (newLesson) => {
          this.toast.success('Quiz lesson linked successfully!');
          this.submittingLesson.set(false);
          this.courseLessons.update(l => [...l, newLesson]);
          this.resetLessonForm();
        },
        error: (err: any) => {
          this.submittingLesson.set(false);
          this.toast.error(err.error?.message || 'Failed to link quiz lesson.');
        }
      });
    }
  }

  private resetLessonForm(): void {
    this.lessonForm.reset({ contentType: 'Video', durationMinutes: 5, isPreview: false });
    this.videoFile = null;
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

  deleteCourse(course: Course): void {
    if (confirm(`Are you sure you want to delete "${course.title}"? This will send a deletion request to Admins.`)) {
      this.courseSvc.delete(course.courseId).subscribe({
        next: (res) => {
          this.toast.success(res.message || 'Course delete request submitted.');
          this.loadCourses();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Failed to submit delete request.');
        }
      });
    }
  }

  // ── Quiz Builder ──────────────────────────────────────

  manageQuizzes(course: Course): void {
    this.selectedCourse.set(course);
    this.activeTab.set('quiz');
    this.loadLessons(course.courseId);
    this.loadQuizzes(course.courseId);
    this.quizQuestions.set([]);
    this.nextQId = 1;
    this.quizForm.reset({ timeLimitMinutes: 10, passingScore: 70, maxAttempts: 3, attachToLesson: false });
  }

  loadQuizzes(courseId: number): void {
    this.assessmentSvc.getQuizzesByCourse(courseId).subscribe({
      next: (quizzes) => this.courseQuizzes.set(quizzes),
      error: () => {}
    });
  }

  addQuestion(): void {
    const q: QuizQuestion = {
      id: this.nextQId++,
      text: '',
      options: [
        { id: 'A', text: '' }, { id: 'B', text: '' },
        { id: 'C', text: '' }, { id: 'D', text: '' }
      ],
      correctOptionId: 'A'
    };
    this.quizQuestions.update(qs => [...qs, q]);
  }

  removeQuestion(id: number): void {
    this.quizQuestions.update(qs => qs.filter(q => q.id !== id));
  }

  updateQuestionText(id: number, text: string): void {
    this.quizQuestions.update(qs => qs.map(q => q.id === id ? { ...q, text } : q));
  }

  updateOptionText(qId: number, optId: string, text: string): void {
    this.quizQuestions.update(qs => qs.map(q => {
      if (q.id !== qId) return q;
      return { ...q, options: q.options.map(o => o.id === optId ? { ...o, text } : o) };
    }));
  }

  setCorrectAnswer(qId: number, optId: string): void {
    this.quizQuestions.update(qs => qs.map(q => q.id === qId ? { ...q, correctOptionId: optId } : q));
  }

  submitQuiz(): void {
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      this.toast.error('Please fill in all required quiz fields.');
      return;
    }
    const qs = this.quizQuestions();
    if (qs.length === 0) {
      this.toast.error('Add at least one question before saving the quiz.');
      return;
    }
    for (const q of qs) {
      if (!q.text.trim()) { this.toast.error(`Question ${q.id} has no text.`); return; }
      for (const o of q.options) {
        if (!o.text.trim()) { this.toast.error(`Question ${q.id}, option ${o.id} is empty.`); return; }
      }
    }

    const course = this.selectedCourse();
    if (!course) return;

    const fv = this.quizForm.value;

    // Build questionsJson: { questionId: correctOptionId }
    const correctAnswers: Record<number, string> = {};
    qs.forEach(q => { correctAnswers[q.id] = q.correctOptionId; });

    // Also store full question data in a separate field so the frontend can render it
    // The backend stores QuestionsJson as the correct-answer map; we store question content in Description JSON
    const questionContent = qs.map(q => ({ id: q.id, text: q.text, options: q.options }));

    const payload: QuizCreatePayload = {
      courseId: course.courseId,
      lessonId: fv.attachToLesson ? (fv.lessonId ?? null) : null,
      title: fv.title!,
      description: JSON.stringify(questionContent),
      timeLimitMinutes: fv.timeLimitMinutes!,
      passingScore: fv.passingScore!,
      maxAttempts: fv.maxAttempts!,
      questionsJson: JSON.stringify(correctAnswers)
    };

    this.submittingQuiz.set(true);
    this.assessmentSvc.createQuiz(payload).subscribe({
      next: (quiz) => {
        this.toast.success(`Quiz "${quiz.title}" created! Publish it when ready.`);
        this.courseQuizzes.update(qs2 => [...qs2, quiz]);
        this.quizQuestions.set([]);
        this.nextQId = 1;
        this.quizForm.reset({ timeLimitMinutes: 10, passingScore: 70, maxAttempts: 3 });
        this.submittingQuiz.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to create quiz.');
        this.submittingQuiz.set(false);
      }
    });
  }

  publishQuiz(quiz: Quiz): void {
    this.publishingQuiz.set(quiz.quizId);
    this.assessmentSvc.publishQuiz(quiz.quizId).subscribe({
      next: () => {
        this.toast.success(`Quiz "${quiz.title}" published!`);
        this.courseQuizzes.update(qs => qs.map(q => q.quizId === quiz.quizId ? { ...q, isPublished: true } : q));
        this.publishingQuiz.set(null);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to publish quiz.');
        this.publishingQuiz.set(null);
      }
    });
  }

  deleteQuiz(quiz: Quiz): void {
    if (confirm(`Delete quiz "${quiz.title}"?`)) {
      this.assessmentSvc.deleteQuiz(quiz.quizId).subscribe({
        next: () => {
          this.toast.success('Quiz deleted.');
          this.courseQuizzes.update(qs => qs.filter(q => q.quizId !== quiz.quizId));
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to delete quiz.')
      });
    }
  }

  parsedQuizQuestionCount(quiz: Quiz): number {
    try {
      const answers = JSON.parse(quiz.questionsJson || '{}');
      return Object.keys(answers).length;
    } catch { return 0; }
  }
}

