import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AssessmentService } from '../../core/services/assessment.service';
import { ToastService } from '../../core/services/toast.service';
import { Quiz, Question, QuizAttempt } from '../../core/models';

type QuizState = 'loading' | 'taking' | 'submitted' | 'error';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './quiz.component.html',
  styleUrl:    './quiz.component.scss',
})
export class QuizComponent implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly assessSvc  = inject(AssessmentService);
  private readonly toast      = inject(ToastService);

  courseId  = 0;
  quiz      = signal<Quiz | null>(null);
  state     = signal<QuizState>('loading');
  answers   = signal<Record<string, string>>({});  // { questionId: optionId }
  result    = signal<QuizAttempt | null>(null);
  current   = signal(0);  // current question index
  submitting = signal(false);

  // Derived
  questions   = computed(() => this.quiz()?.questions ?? []);
  currentQ    = computed(() => this.questions()[this.current()]);
  totalQ      = computed(() => this.questions().length);
  answeredCount = computed(() => Object.keys(this.answers()).length);
  progressPct   = computed(() =>
    this.totalQ() ? Math.round(((this.current() + 1) / this.totalQ()) * 100) : 0
  );
  isLastQ = computed(() => this.current() === this.totalQ() - 1);
  currentAnswer = computed(() => this.answers()[this.currentQ()?.questionId] ?? null);

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    const quizId  = Number(this.route.snapshot.paramMap.get('quizId'));
    this.loadQuiz(quizId);
  }

  private loadQuiz(quizId: number): void {
    this.assessSvc.getQuizById(quizId).subscribe({
      next: (quiz: Quiz) => { this.quiz.set(quiz); this.state.set('taking'); },
      error: (_err: unknown) => { this.state.set('error'); this.toast.error('Quiz not found.'); },
    });
  }

  selectAnswer(questionId: number, optionId: string): void {
    this.answers.update(prev => ({ ...prev, [questionId]: optionId }));
  }

  next():  void { if (this.current() < this.totalQ() - 1) this.current.update(v => v + 1); }
  prev():  void { if (this.current() > 0) this.current.update(v => v - 1); }
  goTo(i: number): void { this.current.set(i); }

  submit(): void {
    if (this.answeredCount() < this.totalQ()) {
      this.toast.error(`Please answer all ${this.totalQ()} questions before submitting.`);
      return;
    }
    this.submitting.set(true);
    this.assessSvc.submitAttempt(this.quiz()!.quizId, { answers: this.answers() }).subscribe({
      next: (attempt: QuizAttempt) => {
        this.result.set(attempt);
        this.state.set('submitted');
        this.submitting.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error(err.error?.message ?? 'Submission failed.');
        this.submitting.set(false);
      },
    });
  }

  retry(): void {
    this.answers.set({});
    this.current.set(0);
    this.result.set(null);
    this.state.set('taking');
  }

  isOptionSelected(optionId: string): boolean {
    return this.currentAnswer() === optionId;
  }

  isCorrectOption(q: Question, optionId: string): boolean {
    return q.correctAnswer === optionId;
  }

  wasAnsweredCorrectly(q: Question): boolean {
    return this.answers()[q.questionId] === q.correctAnswer;
  }

  getOptionText(q: Question, optionId: string | undefined): string {
    if (!optionId) return '—';
    return q.options.find((o: { optionId: string; text: string }) => o.optionId === optionId)?.text ?? optionId;
  }
}
