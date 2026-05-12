import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

const ACCESS_TOKEN_KEY = 'edulearn_access_token';

/**
 * Attaches the JWT Bearer token from localStorage to every outgoing HTTP
 * request that targets our own backend APIs.
 *
 * Skips token injection for:
 *  - login / register / refresh endpoints (public)
 *  - any third-party URLs that don't target the gateway
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

/** Returns true if the URL targets one of our microservices through the gateway. */
function isOurApi(url: string): boolean {
  return url.includes('gateway-api.mangoisland-961b8c02.southeastasia.azurecontainerapps.io') || url.includes('/gateway/');
}

/** Public endpoints that must NOT receive the Authorization header. */
function isPublicAuthEndpoint(url: string): boolean {
  return (
    url.includes('/gateway/auth/api/auth/login') ||
    url.includes('/gateway/auth/api/auth/register') ||
    url.includes('/gateway/auth/api/auth/refresh') ||
    url.includes('/gateway/auth/api/auth/validate-token')
  );
}
