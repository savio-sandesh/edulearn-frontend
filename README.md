<div align="center">

<img src="https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 21" />
<img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/.NET-Backend-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET Backend" />
<img src="https://img.shields.io/badge/Status-Completed-10b981?style=for-the-badge" alt="Status" />

# 🎓 EduLearn — Frontend

**A modern, production-grade e-learning platform frontend built with Angular 21, signals-based state management, and a premium dark design system.**

[Live Preview](http://localhost:4200) · [Backend Repo](../edulearn-backend) · [Report Bug](#) · [Request Feature](#)

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
- [Feature Roadmap](#-feature-roadmap)
- [API Integration](#-api-integration)
- [Design System](#-design-system)
- [Guards & Auth Flow](#-guards--auth-flow)

---

## 🌟 Overview

EduLearn is a full-stack e-learning platform designed around a **.NET microservices backend** and a modern **Angular 21 frontend**. The frontend communicates directly with each microservice via environment-driven base URLs, providing a clean and maintainable separation of concerns.

The UI is built around a **premium dark design system** with glassmorphism cards, smooth animations, and a fully responsive layout — optimised for desktop and mobile.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Angular 21 (Standalone Components) |
| **Language** | TypeScript 5.x |
| **State Management** | Angular Signals (`signal`, `computed`, `effect`) |
| **Forms** | Angular Reactive Forms |
| **HTTP** | `HttpClient` + Functional Interceptors |
| **Routing** | Angular Router (Lazy-loaded, View Transitions) |
| **Styling** | Custom CSS Design System (CSS Variables, SCSS) |
| **Build Tool** | Angular CLI + esbuild |
| **Runtime** | Node.js v22 |

---

## 👥 User Roles & Features

### 🎓 Student
- **Course Discovery**: Browse, search, and filter premium courses.
- **Learning Hub**: Secure enrollment with progress tracking.
- **Interactive Learning**: Custom video player with side-by-side lesson navigation.
- **Assessments**: Take quizzes with immediate, automatic grading.
- **Achievements**: Earn downloadable certificates upon course completion.

### 👨‍🏫 Instructor
- **Course Management**: Dedicated dashboard to manage authored content.
- **Course Creation**: Define courses with categories, levels, and pricing structures.
- **Media Uploads**: Seamless course thumbnail uploads (via Azure Blob Storage).
- **Publishing Workflow**: Submit finalized courses to administrators for platform approval.

### 🛡️ Admin
- **Analytics Dashboard**: Platform-wide statistics with dynamic, Signals-driven visual CSS charts.
- **User Management**: Comprehensive oversight including Soft Delete and Block/Unblock capabilities.
- **Moderation**: Course approval workflow to review, approve, or reject pending instructor submissions.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Angular 21 Frontend                   │
│                    localhost:4200                        │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Landing │  │   Auth   │  │ Courses  │  │  ...   │ │
│  │  Page    │  │  Login / │  │  Browse  │  │ Phases │ │
│  │ (Phase 3)│  │ Register │  │ (Phase 4)│  │  5-6   │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
│                                                         │
│  ┌─────────────────── Core Layer ──────────────────┐   │
│  │  AuthService (Signals)  │  JwtInterceptor        │   │
│  │  ToastService           │  ErrorInterceptor      │   │
│  │  Guards: auth/guest/role                         │   │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP (Direct calls)
        ┌──────────────────┼──────────────────────┐
        ▼                  ▼                       ▼
┌──────────────┐  ┌──────────────┐      ┌──────────────┐
│  Auth API    │  │  Course API  │  ... │ Progress API │
│  :5206       │  │  :5224       │      │  :5218       │
└──────────────┘  └──────────────┘      └──────────────┘
```

### Key Design Decisions

- **Direct microservice calls** — No API gateway; all base URLs are environment-driven for easy gateway adoption later.
- **Signals-first** — `AuthService` uses `signal<User|null>` with `computed` helpers (`isLoggedIn`, `userRole`, `isInstructor`, `isAdmin`).
- **Functional interceptors** — `JwtInterceptor` and `ErrorInterceptor` are registered via `withInterceptors([...])` in `app.config.ts`.
- **Lazy loading everywhere** — All feature routes use `loadComponent()` for optimal bundle splitting.
- **localStorage for JWT** — Standard approach for microservices; tokens stored with `edulearn_` prefix.

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
│   │   │   ├── jwt.interceptor.ts     # Attaches Bearer token
│   │   │   └── error.interceptor.ts   # Global 401/403/5xx handling + toasts
│   │   ├── models/
│   │   │   ├── user.model.ts          # User, AuthResponse, DTOs
│   │   │   ├── course.model.ts        # Course, Review
│   │   │   ├── lesson.model.ts        # Lesson, reorder DTOs
│   │   │   ├── enrollment.model.ts    # Enrollment, Certificate, Progress
│   │   │   ├── assessment.model.ts    # Quiz, Question, Attempt
│   │   │   └── index.ts              # Barrel export
│   │   └── services/
│   │       ├── auth.service.ts        # Signal-based auth state
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
│   │   ├── landing/                   # ✅ Phase 3 (stub → full hero page)
│   │   ├── auth/
│   │   │   ├── login/                 # ✅ Phase 3 — Reactive form, JWT auth
│   │   │   └── register/              # ✅ Phase 3 — Role picker, auto-login
│   │   ├── courses/
│   │   │   ├── list/                  # ✅ Phase 4 — Browse, search, filter
│   │   │   └── detail/               # ✅ Phase 4 — Course detail + enroll
│   │   ├── learn/                     # ✅ Phase 5 — Video player + lessons
│   │   ├── quiz/                      # ✅ Phase 5 — Quiz attempt flow
│   │   ├── dashboard/                 # ✅ Phase 6 — Student dashboard
│   │   ├── instructor/               # ✅ Phase 6 — Course management
│   │   ├── admin/                     # ✅ Phase 6 — Platform admin panel
│   │   ├── profile/                   # ✅ Phase 6 — User profile
│   │   └── certificates/             # ✅ Phase 6 — Certificate viewer
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
- **Angular CLI** v21 — `npm install -g @angular/cli`
- **.NET 8 SDK** — [Download](https://dotnet.microsoft.com/) *(for the backend)*

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/edulearn.git
cd edulearn/edulearn-frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm start
# → http://localhost:4200
```

### Running the Backend

The backend is a .NET solution. Start each microservice from its directory:

```bash
cd edulearn-backend

# Auth Service (port 5206)
cd src/EduLearn.Auth.API && dotnet run

# Course Service (port 5224)
cd src/EduLearn.Course.API && dotnet run

# Enrollment Service (port 5208)
cd src/EduLearn.Enrollment.API && dotnet run

# ... and so on for Content, Assessment, Progress
```

---

## ⚙️ Environment Configuration

All microservice base URLs live in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apis: {
    auth:       'http://localhost:5206/api',
    course:     'http://localhost:5224/api',
    enrollment: 'http://localhost:5208/api',
    content:    'http://localhost:5234/api',
    assessment: 'http://localhost:5242/api',
    progress:   'http://localhost:5218/api',
  },
};
```

For production, update `environment.production.ts` with your deployed API base URLs. The build automatically swaps files via `fileReplacements` in `angular.json`.

---

## 🗺 Feature Roadmap

| Phase | Scope | Status |
|---|---|---|
| **Phase 1** | Core foundation: models, interceptors, AuthService, app config | ✅ Complete |
| **Phase 2** | Design system, shared components (Navbar, Footer, Toast, CourseCard), routes & guards | ✅ Complete |
| **Phase 3** | Auth pages: Login & Register with reactive forms & full auth flow | ✅ Complete |
| **Phase 4** | Course Catalog (browse, search, filter) + Course Detail + Enroll | ✅ Complete |
| **Phase 5** | Learning experience: video player, lesson sidebar, Quiz attempt flow | ✅ Complete |
| **Phase 6** | Dashboards: Student, Instructor (course CRUD), Admin panel, Profile, Certificates | ✅ Complete |

---

## 🔌 API Integration

| Service | Port | Responsibility |
|---|---|---|
| **Auth API** | `:5206` | Register, Login, Profile, JWT refresh, User Management (Admin) |
| **Course API** | `:5224` | Course CRUD, search, reviews |
| **Enrollment API** | `:5208` | Enroll, completion tracking |
| **Content API** | `:5234` | Lessons, video content, file uploads |
| **Assessment API** | `:5242` | Quizzes, questions, attempt grading |
| **Progress API** | `:5218` | Lesson progress, certificates |

### HTTP Interceptors

- **`JwtInterceptor`** — Automatically injects `Authorization: Bearer <token>` on all requests to `localhost` APIs. Public endpoints (`/login`, `/register`) are skipped.
- **`ErrorInterceptor`** — Handles `401` (auto-logout + redirect), `403` (forbidden redirect), `0` (network error), and `5xx` (server error) globally. User-facing messages are shown via `ToastService`.

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
/login, /register  →  guestGuard   →  Redirects to /dashboard if logged in
/dashboard         →  authGuard    →  Redirects to /login?returnUrl=... if not logged in
/instructor        →  roleGuard('INSTRUCTOR')  →  Redirects to / if wrong role
/admin             →  roleGuard('ADMIN')        →  Redirects to / if wrong role
```

### Auth State (Signals)

```typescript
// AuthService exposes read-only computed signals:
auth.currentUser()    // User | null
auth.isLoggedIn()     // boolean
auth.userRole()       // UserRole | null
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
| `npm run watch` | Rebuild on file changes (CI mode) |
| `npm test` | Run unit tests via Karma |
| `npx tsc --noEmit` | Type-check without emitting output |

---

<div align="center">

**Built with ❤️ using Angular 21 + .NET 10 Microservices**

</div>
