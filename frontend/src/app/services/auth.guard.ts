import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

export const coordinateurGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isCoordinateur() ? true : inject(Router).createUrlTree(['/tableau-de-bord']);
};
