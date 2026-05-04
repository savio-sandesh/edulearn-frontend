import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'courses',
    loadComponent: () => import('./features/courses/list/course-list.component').then(m => m.CourseListComponent),
  },
  {
    path: 'courses/:id',
    loadComponent: () => import('./features/courses/detail/course-detail.component').then(m => m.CourseDetailComponent),
  },
  {
    path: 'courses/:id/learn',
    loadComponent: () => import('./features/learn/learn.component').then(m => m.LearnComponent),
    canActivate: [authGuard],
  },
  {
    path: 'courses/:id/quiz/:quizId',
    loadComponent: () => import('./features/quiz/quiz.component').then(m => m.QuizComponent),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, roleGuard('STUDENT')],
  },
  {
    path: 'instructor',
    loadComponent: () => import('./features/instructor/instructor.component').then(m => m.InstructorComponent),
    canActivate: [authGuard, roleGuard('INSTRUCTOR')],
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard, roleGuard('ADMIN')],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'certificates/:id',
    loadComponent: () => import('./features/certificates/certificate.component').then(m => m.CertificateComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];

