<div align="center">

<img src="https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 21" />
<img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.9" />
<img src="https://img.shields.io/badge/.NET-10_Microservices-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 10 Microservices" />
<img src="https://img.shields.io/badge/Status-Completed-10b981?style=for-the-badge" alt="Status" />

# 🎓 EduLearn — Frontend

**A modern, production-grade e-learning platform frontend built with Angular 21, signals-based state management, and a premium dark design system.**

[Live Preview](http://localhost:4200) · [Backend Repo](../edulearn-backend) · [Root README](../README.md)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [User Roles & Features](#-user-roles--features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Routes](#-routes)
- [API Integration](#-api-integration)
- [Feature Roadmap](#-feature-roadmap)
- [Design System](#-design-system)
- [Guards & Auth Flow](#-guards--auth-flow)
- [Available Scripts](#-available-scripts)

---

## 🌟 Overview

EduLearn is a full-stack e-learning platform built around a **.NET 10 microservices backend** and a modern **Angular 21 frontend**. The frontend communicates with backend services directly via environment-driven base URLs (or through the optional YARP Gateway), providing a clean and maintainable separation of concerns.

The UI is built around a **premium dark design system** with glassmorphism cards, smooth animations, and a fully responsive layout — optimised for desktop and mobile.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Angular 21 (Standalone Components) |
| **Language** | TypeScript 5.9 |
| **State Management** | Angular Signals (`signal`, `computed`, `effect`) |
| **Forms** | Angular Reactive Forms |
| **HTTP** | `HttpClient` + Functional Interceptors |
| **Routing** | Angular Router (Lazy-loaded, View Transitions) |
| **Styling** | Custom SCSS Design System (CSS Variables) + TailwindCSS 4 |
| **Build Tool** | Angular CLI 21 + esbuild |
| **Runtime** | Node.js v22 / npm 10 |

---

## 👥 User Roles & Features

### 🎓 Student
- **Course Discovery** — Browse, search, and filter published courses from the catalog.
- **Learning Hub** — Secure enrollment with per-lesson progress tracking and completion state.
- **Interactive Learning** — In-course player supporting `VIDEO`, `ARTICLE`, and `QUIZ_LINK` lesson types with side-by-side lesson navigation.
- **Assessments** — Take quizzes with automatic answer evaluation and pass/fail grading.
- **Achievements** — Earn downloadable PDF certificates upon course completion.

### 👨‍🏫 Instructor
- **Course Management** — Dedicated portal to create, update, publish, and manage authored courses.
- **Lesson Management** — Add, reorder, and publish lessons; upload video content to Azure Blob Storage.
- **Media Uploads** — Course thumbnail uploads via Azure Blob Storage.
- **Publishing Workflow** — Submit finalized courses for admin approval.

### 🛡️ Admin
- **Analytics Dashboard** — Platform-wide statistics with Signals-driven visual CSS charts.
- **User Management** — Comprehensive oversight including soft delete and block/unblock capabilities.
- **Course Moderation** — Approve or reject pending instructor course submissions.
- **Review Moderation** — Approve student reviews for public visibility.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Angular 21 Frontend                     │
│                       localhost:4200                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐    │
│  │ Landing  │  │   Auth   │  │ Courses  │  │  Learn /  │    │
│  │  Page    │  │ Login /  │  │ Catalog  │  │  Quiz /   │    │
│  │          │  │ Register │  │  Detail  │  │ Dashboard │    │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘    │
│                                                             │
│  ┌──────────────────── Core Layer ──────────────────────┐  │
│  │  AuthService (Signals)  │  JwtInterceptor            │   │
│  │  ToastService           │  ErrorInterceptor          │   │
│  │  Guards: auth / guest / role                         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (direct or via Gateway)
      ┌────────────────────┼─────────────────────────┐
      ▼                    ▼                          ▼
┌──────────────┐  ┌──────────────┐       ┌──────────────────┐
│  Auth API    │  │  Course API  │  ...  │  Gateway API     │
│  :5206       │  │  :5224       │       │  :5100 (YARP)    │
└──────────────┘  └──────────────┘       └──────────────────┘
```

### Key Design Decisions

- **Direct microservice calls** — The default `environment.ts` points directly at each service. The YARP Gateway (`Edulearn.Gateway.API`) is available as a single-origin alternative.
- **Signals-first** — `AuthService` uses `signal<User|null>` with `computed` helpers: `isLoggedIn`, `userRole`, `isStudent`, `isInstructor`, `isAdmin`.
- **Functional interceptors** — `JwtInterceptor` and `ErrorInterceptor` are registered via `withInterceptors([...])` in `app.config.ts`.
- **Lazy loading everywhere** — All feature routes use `loadComponent()` for optimal bundle splitting.
- **localStorage for JWT** — Tokens stored with the `edulearn_` key prefix.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts          # Requires authentication
│   │   │   ├── guest.guard.ts         # Blocks authenticated users
│   │   │   └── role.guard.ts          # Role-based access (factory)
│   │   ├── interceptors/
│   │   │   ├── jwt.interceptor.ts     # Attaches Bearer token to all API calls
│   │   │   └── error.interceptor.ts   # Global 401/403/5xx handling + toasts
│   │   ├── models/
│   │   │   ├── user.model.ts          # User, AuthResponse, DTOs
│   │   │   ├── course.model.ts        # Course, Review
│   │   │   ├── lesson.model.ts        # Lesson, ContentType, reorder DTOs
│   │   │   ├── enrollment.model.ts    # Enrollment, Certificate, Progress
│   │   │   ├── assessment.model.ts    # Quiz, Question, Attempt
│   │   │   └── index.ts              # Barrel export
│   │   └── services/
│   │       ├── auth.service.ts        # Signal-based auth state + API calls
│   │       ├── course.service.ts      # Course catalog, CRUD, reviews
│   │       ├── content.service.ts     # Lesson CRUD, video upload
│   │       ├── enrollment.service.ts  # Enroll, progress, certificates
│   │       ├── assessment.service.ts  # Quizzes, attempts, grading
│   │       └── toast.service.ts       # Signal-based toast notifications
│   │
│   ├── shared/
│   │   └── components/
│   │       ├── navbar/                # Glassmorphism navbar (role-aware)
│   │       ├── footer/                # Dark footer with link columns
│   │       ├── toast/                 # Auto-dismissing notification overlay
│   │       ├── loader/                # Full-screen & inline spinner
│   │       ├── course-card/           # Course tile with hover effects
│   │       └── star-rating/           # Display & interactive star rating
│   │
│   ├── features/
│   │   ├── landing/                   # ✅ Hero page with feature highlights
│   │   ├── auth/
│   │   │   ├── login/                 # ✅ Reactive form, JWT auth
│   │   │   └── register/              # ✅ Role picker, auto-login on success
│   │   ├── courses/
│   │   │   ├── list/                  # ✅ Browse, search, filter published courses
│   │   │   └── detail/               # ✅ Course detail, preview lessons, enroll
│   │   ├── learn/                     # ✅ In-course player (VIDEO / ARTICLE / QUIZ_LINK)
│   │   ├── quiz/                      # ✅ Quiz attempt flow with grading
│   │   ├── dashboard/                 # ✅ Student dashboard with progress bars
│   │   ├── instructor/               # ✅ Course & lesson management portal
│   │   ├── admin/                     # ✅ Platform admin (users, courses, reviews)
│   │   ├── profile/                   # ✅ User profile & password change
│   │   └── certificates/             # ✅ Certificate viewer & PDF download
│   │
│   ├── app.ts                         # Root component (shell)
│   ├── app.html                       # Navbar + RouterOutlet + Footer + Toast
│   ├── app.scss                       # Shell layout styles
│   ├── app.routes.ts                  # All lazy-loaded routes + guards
│   └── app.config.ts                  # providers: HttpClient, Router, Animations
│
├── environments/
│   ├── environment.ts                 # Development (localhost ports)
│   └── environment.production.ts     # Production URLs
│
├── styles.scss                        # Global design system (tokens, reset, utils)
└── index.html                         # SEO meta, theme-color
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v22+ — [Download](https://nodejs.org/)
- **npm** v10+
- **Angular CLI** v21 — `npm install -g @angular/cli`
- **.NET 10 SDK** — [Download](https://dotnet.microsoft.com/) *(for the backend)*

### Installation

```powershell
# From the repo root, navigate to the frontend
cd edulearn-frontend

# Install dependencies
npm install

# Start the development server
npm start
# → http://localhost:4200
```

### Running the Backend

The frontend expects all backend services to be running. See the [root README](../README.md#quick-start) for full setup instructions. At a minimum, start:

```powershell
# From repo root
dotnet run --project .\edulearn-backend\src\EduLearn.Auth.API\EduLearn.Auth.API.csproj
dotnet run --project .\edulearn-backend\src\EduLearn.Course.API\EduLearn.Course.API.csproj
dotnet run --project .\edulearn-backend\src\EduLearn.Content.API\EduLearn.Content.API.csproj
dotnet run --project .\edulearn-backend\src\EduLearn.Enrollment.API\EduLearn.Enrollment.API.csproj
dotnet run --project .\edulearn-backend\src\EduLearn.Progress.API\EduLearn.Progress.API.csproj
dotnet run --project .\edulearn-backend\src\EduLearn.Assessment.API\EduLearn.Assessment.API.csproj
```

---

## ⚙️ Environment Configuration

All microservice base URLs are defined in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apis: {
    auth:       'http://localhost:5206',
    course:     'http://localhost:5224',
    enrollment: 'http://localhost:5259',
    content:    'http://localhost:5176',
    assessment: 'http://localhost:5012',
    progress:   'http://localhost:5218',
  },
};
```

> **Note:** The `EduLearn.Review.API` (`:5144`) and `Edulearn.Gateway.API` (`:5100`) are available in the backend but are not wired into the Angular environment config by default. Wire them in as needed.

For production, update `environment.production.ts` with your deployed API base URLs. The build automatically swaps files via `fileReplacements` in `angular.json`.

---

## 🗺 Routes

All routes are lazy-loaded via `loadComponent()`.

| Path | Component | Guard |
|---|---|---|
| `/` | `LandingComponent` | — |
| `/login` | `LoginComponent` | `guestGuard` |
| `/register` | `RegisterComponent` | `guestGuard` |
| `/courses` | `CourseListComponent` | — |
| `/courses/:id` | `CourseDetailComponent` | — |
| `/courses/:id/learn` | `LearnComponent` | `authGuard` |
| `/courses/:id/quiz/:quizId` | `QuizComponent` | `authGuard` |
| `/dashboard` | `DashboardComponent` | `authGuard` + `roleGuard('STUDENT')` |
| `/instructor` | `InstructorComponent` | `authGuard` + `roleGuard('INSTRUCTOR')` |
| `/admin` | `AdminComponent` | `authGuard` + `roleGuard('ADMIN')` |
| `/profile` | `ProfileComponent` | `authGuard` |
| `/certificates/:id` | `CertificateComponent` | `authGuard` |
| `/**` | → `/` | — |

---

## 🔌 API Integration

| Service | Dev Port | Responsibility |
|---|---|---|
| **Auth API** | `:5206` | Register, login, JWT refresh, profile, user management (Admin) |
| **Course API** | `:5224` | Course CRUD, search, categories, thumbnail upload, reviews |
| **Enrollment API** | `:5259` | Enroll, unenroll, list enrollments, completion tracking |
| **Content API** | `:5176` | Lesson CRUD (VIDEO / ARTICLE / QUIZ\_LINK), reorder, video upload |
| **Assessment API** | `:5012` | Quiz authoring, attempt lifecycle, auto-grading |
| **Progress API** | `:5218` | Lesson-level progress, PDF certificate generation & download |
| **Review API** | `:5144` | Course reviews, admin moderation *(not in env config by default)* |
| **Gateway API** | `:5100` | YARP reverse proxy — single-origin alternative to direct calls |

### HTTP Interceptors

- **`JwtInterceptor`** — Automatically injects `Authorization: Bearer <token>` on all requests to `localhost` APIs. Public endpoints (`/login`, `/register`) are not excluded — the backend handles unauthenticated requests gracefully.
- **`ErrorInterceptor`** — Handles `401` (auto-logout + redirect to `/login`), `403` (forbidden), `0` (network error), and `5xx` (server error) globally via `ToastService`.

### Angular Services (core/services)

| Service | Backed By |
|---|---|
| `AuthService` | Auth API |
| `CourseService` | Course API |
| `ContentService` | Content API |
| `EnrollmentService` | Enrollment API + Progress API |
| `AssessmentService` | Assessment API |
| `ToastService` | (local signal state only) |

---

## 🗓 Feature Roadmap

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | Core foundation: models, interceptors, `AuthService`, app config | ✅ Complete |
| **Phase 2** | Design system, shared components (Navbar, Footer, Toast, CourseCard, StarRating), routes & guards | ✅ Complete |
| **Phase 3** | Auth pages: Login & Register with reactive forms & full auth flow | ✅ Complete |
| **Phase 4** | Course Catalog (browse, search, filter) + Course Detail + Enroll | ✅ Complete |
| **Phase 5** | Learning experience: in-course player (VIDEO / ARTICLE / QUIZ\_LINK), quiz attempt flow | ✅ Complete |
| **Phase 6** | Dashboards: Student (with progress bars), Instructor (course + lesson CRUD), Admin panel, Profile, Certificates | ✅ Complete |

---

## 🎨 Design System

The design system is defined entirely through **CSS custom properties** in `src/styles.scss`:

```scss
:root {
  --bg:           #080810;     /* Page background    */
  --surface:      #111122;     /* Card backgrounds   */
  --primary:      #7c3aed;     /* Purple accent      */
  --primary-light:#a78bfa;     /* Hover states       */
  --accent:       #f59e0b;     /* Amber highlights   */
  --text:         #e2e8f0;     /* Primary text       */
  --text-muted:   #94a3b8;     /* Secondary text     */
  --radius-lg:    16px;        /* Card border radius */
  --ease:         0.2s cubic-bezier(0.4,0,0.2,1); /* Transitions */
}
```

**Global utility classes:** `.gradient-text`, `.glass`, `.card`, `.btn-primary`, `.btn-ghost`, `.badge`

**Typography:** [Inter](https://fonts.google.com/specimen/Inter) (body) + [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (headings)

---

## 🔒 Guards & Auth Flow

```
/login, /register         →  guestGuard             →  Redirects to /dashboard if already logged in
/dashboard                →  authGuard + roleGuard('STUDENT')    →  Redirects to /login if unauthenticated
/courses/:id/learn        →  authGuard              →  Redirects to /login?returnUrl=...
/courses/:id/quiz/:quizId →  authGuard              →  Redirects to /login?returnUrl=...
/instructor               →  authGuard + roleGuard('INSTRUCTOR') →  Redirects to / if wrong role
/admin                    →  authGuard + roleGuard('ADMIN')      →  Redirects to / if wrong role
/profile, /certificates   →  authGuard              →  Redirects to /login if unauthenticated
```

### Auth State (Signals)

```typescript
// AuthService exposes read-only computed signals:
auth.currentUser()    // User | null
auth.isLoggedIn()     // boolean
auth.userRole()       // 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | null
auth.isStudent()      // boolean
auth.isInstructor()   // boolean
auth.isAdmin()        // boolean
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start dev server at `http://localhost:4200` |
| `npm run build` | Build production bundle to `dist/` |
| `npm run watch` | Rebuild on file changes (CI/watch mode) |
| `npm test` | Run unit tests via Karma |
| `npx tsc --noEmit` | Type-check without emitting output |

---

<div align="center">

**Built with ❤️ using Angular 21 + .NET 10 Microservices**

</div>
