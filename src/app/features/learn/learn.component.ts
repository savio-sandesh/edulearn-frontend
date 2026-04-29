import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from '../../core/services/content.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { CourseService } from '../../core/services/course.service';
import { ToastService } from '../../core/services/toast.service';
import { Lesson, Course, LessonProgress } from '../../core/models';

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
  private readonly contentSvc = inject(ContentService);
  private readonly enrollSvc  = inject(EnrollmentService);
  private readonly courseSvc  = inject(CourseService);
  private readonly toast      = inject(ToastService);

  courseId  = signal(0);
  course    = signal<Course | null>(null);
  lessons   = signal<Lesson[]>([]);
  progress  = signal<LessonProgress[]>([]);
  current   = signal<Lesson | null>(null);
  loading   = signal(true);
  marking   = signal(false);
  sidebarOpen = signal(true);

  safeVideoUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.current()?.contentUrl;
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.toEmbedUrl(url));
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
    if (window.innerWidth < 768) this.sidebarOpen.set(false);
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
