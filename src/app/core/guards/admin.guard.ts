import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  
  if (user && user.role === 'ADMIN') {
    return true;
  }
  
  return router.createUrlTree(['/dashboard']);
};
