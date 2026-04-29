import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../../core/services/course.service';
import { ToastService } from '../../../core/services/toast.service';
import { Course } from '../../../core/models';
import { CourseCardComponent } from '../../../shared/components/course-card/course-card.component';

const CATEGORIES = ['All', 'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'DevOps', 'Cybersecurity', 'Design', 'Business'];
const LEVELS     = ['All', 'Beginner', 'Intermediate', 'Advanced'];

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [FormsModule, CourseCardComponent],
  templateUrl: './course-list.component.html',
  styleUrl:    './course-list.component.scss',
})
export class CourseListComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly toast         = inject(ToastService);

  readonly categories = signal<string[]>(['All']);
  readonly levels     = LEVELS;

  // ── State ─────────────────────────────────────────────────
  courses         = signal<Course[]>([]);
  loading         = signal(true);
  searchQuery     = signal('');
  selectedCategory= signal('All');
  selectedLevel   = signal('All');
  searchInput     = '';   // bound to input, debounced on submit

  // ── Computed ──────────────────────────────────────────────
  filteredCourses = computed(() => {
    const q    = this.searchQuery().toLowerCase();
    const cat  = this.selectedCategory();
    const lvl  = this.selectedLevel();
    return this.courses().filter(c => {
      const matchSearch   = !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
      const matchCategory = cat === 'All' || c.category === cat;
      const matchLevel    = lvl === 'All' || c.level === lvl;
      return matchSearch && matchCategory && matchLevel;
    });
  });

  totalCount = computed(() => this.filteredCourses().length);

  ngOnInit(): void {
    this.loadCourses();
    this.loadCategories();
  }

  loadCategories(): void {
    this.courseService.getCategories().subscribe({
      next: (cats) => this.categories.set(['All', ...cats]),
      error: () => console.warn('Could not load categories.')
    });
  }

  loadCourses(): void {
    this.loading.set(true);
    this.courseService.getAll().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Could not load courses. Is the backend running?');
        this.loading.set(false);
      },
    });
  }

  onSearch(): void {
    this.searchQuery.set(this.searchInput.trim());
  }

  clearSearch(): void {
    this.searchInput = '';
    this.searchQuery.set('');
  }

  setCategory(cat: string): void { this.selectedCategory.set(cat); }
  setLevel(lvl: string):    void { this.selectedLevel.set(lvl); }

  clearFilters(): void {
    this.searchInput = '';
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.selectedLevel.set('All');
  }

  hasActiveFilters = computed(() =>
    this.searchQuery() !== '' ||
    this.selectedCategory() !== 'All' ||
    this.selectedLevel() !== 'All'
  );
}
