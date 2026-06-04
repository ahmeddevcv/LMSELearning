import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole, SupervisorPermissionType } from '../models';

// ═══════════════════════════════════════════════════════════════════
// 1. AUTH GUARD — must be logged in
// ═══════════════════════════════════════════════════════════════════
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  // Redirect to appropriate login
  router.navigate(['/login/student']);
  return false;
};

// ═══════════════════════════════════════════════════════════════════
// 2. ROLE GUARD — must have correct role
// Usage: canActivate: [roleGuard], data: { roles: ['Admin', 'Supervisor'] }
// ═══════════════════════════════════════════════════════════════════
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login/student']);
    return false;
  }

  const allowedRoles = (route.data['roles'] as UserRole[]) ?? [];
  const userRole = auth.userRole();

  if (!userRole || (allowedRoles.length > 0 && !allowedRoles.includes(userRole))) {
    // Redirect to their correct dashboard
    router.navigate([auth.getDashboardPath()]);
    return false;
  }

  return true;
};

// ═══════════════════════════════════════════════════════════════════
// 3. GUEST GUARD — must NOT be logged in (for login pages)
// ═══════════════════════════════════════════════════════════════════
export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return true;

  // Already logged in → go to dashboard
  router.navigate([auth.getDashboardPath()]);
  return false;
};

// ═══════════════════════════════════════════════════════════════════
// 4. SUBSCRIPTION GUARD — student must have active subscription
// ═══════════════════════════════════════════════════════════════════
export const subscriptionGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    router.navigate(['/login/student']);
    return false;
  }

  // Non-students bypass
  if (!auth.isStudent()) return true;

  // Actual subscription check is done server-side (402 response)
  // This guard can check a cached flag if needed
  // For now, allow — the error interceptor handles 402 → renewal redirect
  return true;
};
