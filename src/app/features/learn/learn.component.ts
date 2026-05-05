import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from '../../core/services/content.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { CourseService } from '../../core/services/course.service';
import { AssessmentService } from '../../core/services/assessment.service';
import { ToastService } from '../../core/services/toast.service';
import { Lesson, Course, LessonProgress, Quiz, QuizAttempt, QuizQuestion } from '../../core/models';

@Component({
  selector: 'app-learn',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './learn.component.html',
  styleUrl:    './learn.component.scss',
})
export class LearnComponent implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly sanitizer  = inject(DomSanitizer);
  private readonly contentSvc    = inject(ContentService);
  private readonly enrollSvc     = inject(EnrollmentService);
  private readonly courseSvc     = inject(CourseService);
  private readonly assessmentSvc = inject(AssessmentService);
  private readonly toast         = inject(ToastService);

  courseId  = signal(0);
  course    = signal<Course | null>(null);
  lessons   = signal<Lesson[]>([]);
  progress  = signal<LessonProgress[]>([]);
  current   = signal<Lesson | null>(null);
  loading   = signal(true);
  marking   = signal(false);
  sidebarOpen = signal(true);

  // Quiz state
  currentQuiz       = signal<Quiz | null>(null);
  loadingQuiz       = signal(false);
  activeAttempt     = signal<QuizAttempt | null>(null);
  quizResult        = signal<QuizAttempt | null>(null);
  selectedAnswers   = signal<Record<number, string>>({});
  submittingAttempt = signal(false);
  parsedQuestions   = signal<QuizQuestion[]>([]);

  safeVideoUrl = computed<SafeResourceUrl | null>(() => {
    const lesson = this.current();
    if (!lesson?.contentUrl) return null;
    // Don't embed article or quiz placeholder URLs as video
    if (lesson.contentType === 'ARTICLE' || lesson.contentType === 'QUIZ_LINK') return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.toEmbedUrl(lesson.contentUrl));
  });

  /** Article text — stored in lesson.description for ARTICLE-type lessons. */
  articleContent = computed<string>(() => {
    const lesson = this.current();
    if (lesson?.contentType !== 'ARTICLE') return '';
    return lesson.description ?? '';
  });

  /** Quiz ID extracted from lesson.description for QUIZ_LINK-type lessons. */
  linkedQuizId = computed<number | null>(() => {
    const lesson = this.current();
    if (lesson?.contentType !== 'QUIZ_LINK') return null;
    const id = parseInt(lesson.description ?? '', 10);
    return isNaN(id) ? null : id;
  });

  completedIds = computed(() => new Set(this.progress().map(p => p.lessonId)));

  currentIndex = computed(() =>
    this.lessons().findIndex(l => l.lessonId === this.current()?.lessonId)
  );

  progressPercent = computed(() => {
    const total = this.lessons().length;
    if (!total) return 0;
    return Math.round((this.completedIds().size / total) * 100);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.courseId.set(id);
    this.loadAll(id);
  }

  private loadAll(courseId: number): void {
    this.loading.set(true);
    // Load course info
    this.courseSvc.getById(courseId).subscribe({
      next: (c: Course) => this.course.set(c),
      error: () => {},
    });
    // Load lessons
    this.contentSvc.getLessons(courseId).subscribe({
      next: (lessons: Lesson[]) => {
        const sorted = [...lessons].sort((a, b) => a.order - b.order);
        this.lessons.set(sorted);
        if (sorted.length) this.current.set(sorted[0]);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Could not load lessons.');
        this.loading.set(false);
      },
    });
    // Load progress
    this.enrollSvc.getLessonProgress(courseId).subscribe({
      next: (p: LessonProgress[]) => this.progress.set(p),
      error: () => {},
    });
  }

  selectLesson(lesson: Lesson): void {
    this.current.set(lesson);
    this.currentQuiz.set(null);
    this.activeAttempt.set(null);
    this.quizResult.set(null);
    this.selectedAnswers.set({});
    this.parsedQuestions.set([]);
    if (window.innerWidth < 768) this.sidebarOpen.set(false);

    // For QUIZ_LINK lessons the quizId is stored in lesson.description
    if (lesson.contentType === 'QUIZ_LINK') {
      const quizId = parseInt(lesson.description ?? '', 10);
      if (!isNaN(quizId)) this.loadQuizById(quizId);
    } else {
      // For VIDEO/ARTICLE lessons, check if a quiz is associated via lessonId
      this.loadQuizForLesson(lesson.lessonId);
    }
  }

  private loadQuizById(quizId: number): void {
    this.loadingQuiz.set(true);
    this.assessmentSvc.getQuizById(quizId).subscribe({
      next: (quiz) => {
        if (quiz?.isPublished) {
          this.currentQuiz.set(quiz);
          this.parsedQuestions.set(this.parseQuestions(quiz));
        }
        this.loadingQuiz.set(false);
      },
      error: () => this.loadingQuiz.set(false)
    });
  }

  private loadQuizForLesson(lessonId: number): void {
    this.loadingQuiz.set(true);
    this.assessmentSvc.getQuizByLesson(lessonId).subscribe({
      next: (quiz) => {
        if (quiz?.isPublished) {
          this.currentQuiz.set(quiz);
          this.parsedQuestions.set(this.parseQuestions(quiz));
        }
        this.loadingQuiz.set(false);
      },
      error: () => this.loadingQuiz.set(false)
    });
  }

  parseQuestions(quiz: Quiz): QuizQuestion[] {
    try {
      const content: { id: number; text: string; options: { id: string; text: string }[] }[] =
        JSON.parse(quiz.description || '[]');
      return content.map(q => ({ ...q, correctOptionId: '' }));
    } catch { return []; }
  }

  selectAnswer(questionId: number, optionId: string): void {
    this.selectedAnswers.update(a => ({ ...a, [questionId]: optionId }));
  }

  startQuizAttempt(): void {
    const quiz = this.currentQuiz();
    if (!quiz) return;
    this.submittingAttempt.set(true);
    this.assessmentSvc.startAttempt(quiz.quizId).subscribe({
      next: (attempt) => {
        this.activeAttempt.set(attempt);
        this.submittingAttempt.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not start quiz attempt.');
        this.submittingAttempt.set(false);
      }
    });
  }

  submitQuizAttempt(): void {
    const attempt = this.activeAttempt();
    if (!attempt) return;
    const answers = this.selectedAnswers();
    this.submittingAttempt.set(true);
    this.assessmentSvc.submitAttempt(attempt.attemptId, { answers }).subscribe({
      next: (result) => {
        this.quizResult.set(result);
        this.activeAttempt.set(null);
        this.submittingAttempt.set(false);
        if (result.isPassed) {
          this.toast.success(`🎉 You passed! Score: ${result.score}%`);
        } else {
          this.toast.error(`Score: ${result.score}% — Passing score is ${this.currentQuiz()?.passingScore}%.`);
        }
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not submit quiz.');
        this.submittingAttempt.set(false);
      }
    });
  }

  retryQuiz(): void {
    this.quizResult.set(null);
    this.selectedAnswers.set({});
  }

  markComplete(): void {
    const lesson = this.current();
    if (!lesson || this.completedIds().has(lesson.lessonId)) return;
    this.marking.set(true);
    this.enrollSvc.completeLesson(lesson.lessonId, this.courseId()).subscribe({
      next: (prog: LessonProgress) => {
        this.progress.update(list => [...list, prog]);
        this.marking.set(false);
        this.toast.success('Lesson marked as complete! ?');
        
        // Notify Enrollment API to update its ProgressPercent for this course
        this.enrollSvc.updateCourseProgress(this.courseId()).subscribe();
        
        this.goNext();
      },
      error: (_err: unknown) => {
        this.toast.error('Could not save progress.');
        this.marking.set(false);
      },
    });
  }

  goPrev(): void {
    const idx = this.currentIndex();
    if (idx > 0) this.current.set(this.lessons()[idx - 1]);
  }

  goNext(): void {
    const idx = this.currentIndex();
    const lessons = this.lessons();
    if (idx < lessons.length - 1) this.current.set(lessons[idx + 1]);
  }

  isCompleted(lessonId: number): boolean {
    return this.completedIds().has(lessonId);
  }

  formatDuration(min: number): string {
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }

  private toEmbedUrl(url: string): string {
    // Convert YouTube watch URLs to embed URLs
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  }
}
