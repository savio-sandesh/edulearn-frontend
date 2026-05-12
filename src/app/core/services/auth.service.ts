import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, switchMap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
} from '../models';

const ACCESS_TOKEN_KEY = 'edulearn_access_token';
const REFRESH_TOKEN_KEY = 'edulearn_refresh_token';
const USER_KEY = 'edulearn_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apis.auth}/auth`;

  // ─── Signals ──────────────────────────────────────────────
  private readonly _currentUser = signal<User | null>(this.loadUserFromStorage());

  /** The currently authenticated user (null if not logged in). */
  readonly currentUser = this._currentUser.asReadonly();

  /** True when a user is authenticated. */
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  /** The role of the current user or null. */
  readonly userRole = computed(() => this._currentUser()?.role ?? null);

  readonly isStudent = computed(() => this._currentUser()?.role === 'STUDENT');
  readonly isInstructor = computed(() => this._currentUser()?.role === 'INSTRUCTOR');
  readonly isAdmin = computed(() => this._currentUser()?.role === 'ADMIN');

  // ─── Auth Actions ─────────────────────────────────────────

  /** Register a new account and auto-login on success. */
  register(request: RegisterRequest): Observable<{ message: string; userId: number }> {
    return this.http.post<{ message: string; userId: number }>(
      `${this.base}/register`,
      request
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, request).pipe(
      tap((res) => this.storeTokens(res)),
      switchMap((res) => 
        this.http.get<User>(`${this.base}/profile`).pipe(
          tap((user) => {
            this._currentUser.set(user);
            localStorage.setItem(USER_KEY, JSON.stringify(user));
          }),
          map(() => res),
          catchError(() => of(res))
        )
      )
    );
  }

  /** Refresh access token using stored refresh token. */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return this.http
      .post<AuthResponse>(`${this.base}/refresh`, { refreshToken })
      .pipe(tap((res) => this.storeTokens(res)));
  }

  /** Clear local state and redirect to login. */
  logout(): void {
    const token = this.getAccessToken();
    if (token) {
      // best-effort server-side logout (fire-and-forget)
      this.http.post(`${this.base}/logout`, {}).subscribe({ error: () => {} });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /** Change password for the authenticated user. */
  changePassword(request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/change-password`,
      request
    );
  }

  /** Update name (and optional avatar) using multipart form. */
  updateProfile(fullName: string, avatar?: File): Observable<{ message: string; avatarUrl?: string }> {
    const form = new FormData();
    form.append('fullName', fullName);
    if (avatar) form.append('avatar', avatar);
    return this.http
      .put<{ message: string; avatarUrl?: string }>(`${this.base}/profile`, form)
      .pipe(
        tap((res) => {
          const user = this._currentUser();
          if (user) {
            const updated: User = {
              ...user,
              fullName,
              avatarUrl: res.avatarUrl ?? user.avatarUrl,
            };
            this._currentUser.set(updated);
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
          }
        })
      );
  }

  /** Deactivate the current user's account and log out. */
  deactivateAccount(): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.base}/deactivate`)
      .pipe(tap(() => this.clearSession()));
  }

  // ─── Admin Endpoints ─────────────────────────────────────

  /** Admin: Get active users by role. */
  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/by-role/${role}`).pipe(
      catchError(() => of([])) // Return empty array on 404
    );
  }

  /** Admin: Search users by name or email. */
  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/search?q=${query}`).pipe(
      catchError(() => of([]))
    );
  }

  /** Admin: Toggle user status (block/unblock). */
  toggleUserStatus(userId: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/${userId}/toggle-status`, {});
  }

  /** Admin: Soft delete user. */
  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${userId}`);
  }

  // ─── Token Helpers ────────────────────────────────────────

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  // ─── Private ─────────────────────────────────────────────

  private storeTokens(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
  }

  private fetchAndStoreProfile(): void {
    this.http.get<User>(`${this.base}/profile`).subscribe({
      next: (user) => {
        this._currentUser.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      },
      error: () => {
        // profile fetch failed — session still valid via token
      },
    });
  }

  private loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
  }
}
