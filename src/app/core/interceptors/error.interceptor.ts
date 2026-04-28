import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

const ACCESS_TOKEN_KEY  = 'edulearn_access_token';
const REFRESH_TOKEN_KEY = 'edulearn_refresh_token';
const USER_KEY          = 'edulearn_user';

/**
 * Global error interceptor — handles HTTP error responses consistently.
 *
 * - 401 Unauthorized → clears session, redirects to /login
 * - 403 Forbidden    → redirects to root (role mismatch)
 * - 500+             → logs to console for now (toast integration in Phase 2)
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const toast  = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (err.status) {
        case 401:
          clearLocalSession();
          if (!router.url.includes('/login')) {
            toast.warning('Session expired. Please sign in again.');
            router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
          }
          break;
        case 403:
          toast.error('Access denied — insufficient permissions.');
          router.navigate(['/']);
          break;
        case 404:
          break; // handled per-component
        case 0:
          toast.error('Cannot reach the server. Is the backend running?');
          break;
        default:
          if (err.status >= 500) {
            toast.error(err.error?.message ?? 'A server error occurred. Please try again.');
          }
          break;
      }
      return throwError(() => err);
    })
  );
};

function clearLocalSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
