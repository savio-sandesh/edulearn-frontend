import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

const ACCESS_TOKEN_KEY = 'edulearn_access_token';

/**
 * Attaches the JWT Bearer token from localStorage to every outgoing HTTP
 * request that targets our own backend APIs.
 *
 * Skips token injection for:
 *  - login / register / refresh endpoints (public)
 *  - any third-party URLs that don't contain 'localhost:5'
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  // Only inject for our own API calls
  if (!token || !isOurApi(req.url)) {
    return next(req);
  }

  // Skip token for public auth endpoints to avoid stale token issues
  if (isPublicAuthEndpoint(req.url)) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};

/** Returns true if the URL targets one of our microservices (localhost:5xxx). */
function isOurApi(url: string): boolean {
  return /localhost:5\d{3}/.test(url);
}

/** Public endpoints that must NOT receive the Authorization header. */
function isPublicAuthEndpoint(url: string): boolean {
  return (
    url.includes('/api/user/login') ||
    url.includes('/api/user/register') ||
    url.includes('/api/user/refresh') ||
    url.includes('/api/user/validate-token')
  );
}
