import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { SignalRService } from './signalr.service';
import {
  ApiResponse, LoginRequest, LoginResponse, RefreshResponse, User, UserRole
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http    = inject(HttpClient);
  private readonly router  = inject(Router);
  private readonly storage = inject(StorageService);
  private readonly signalr = inject(SignalRService);

  private readonly api = `${environment.apiUrl}/auth`;

  // ── Signals ──────────────────────────────────────────────────────
  private readonly _currentUser = signal<User | null>(
    this.storage.getUser<User>()
  );
  private readonly _isRefreshing = signal(false);

  readonly currentUser$    = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly userRole        = computed(() => this._currentUser()?.role ?? null);
  readonly isAdmin         = computed(() => this._currentUser()?.role === 'Admin');
  readonly isTeacher       = computed(() => this._currentUser()?.role === 'Teacher');
  readonly isStudent       = computed(() => this._currentUser()?.role === 'Student');
  readonly isParent        = computed(() => this._currentUser()?.role === 'Parent');
  readonly isSupervisor    = computed(() => this._currentUser()?.role === 'Supervisor');

  // Subject used to queue 401 retries during refresh
  private refreshing$ = new BehaviorSubject<boolean>(false);

  // ── Public API ───────────────────────────────────────────────────
  login(email: string, password: string, role: UserRole): Observable<ApiResponse<LoginResponse>> {
    const body: LoginRequest = { email, password, expectedRole: role };
    return this.http.post<ApiResponse<LoginResponse>>(`${this.api}/login`, body).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.storage.setTokens(res.data.accessToken, res.data.refreshToken, res.data.expiresAt);
          this.storage.setUser(res.data.user);
          this._currentUser.set(res.data.user);
          // Fetch /auth/me right after login to hydrate the permissions array
          // for supervisors (login response doesn't include them).
          if (res.data.user.role === 'Supervisor') {
            this.getCurrentUser().subscribe({ error: () => {} });
          }
        }
      })
    );
  }

  refreshToken(): Observable<ApiResponse<RefreshResponse>> {
    const refreshToken = this.storage.getRefreshToken();
    return this.http.post<ApiResponse<RefreshResponse>>(
      `${this.api}/refresh`,
      { refreshToken }
    ).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.storage.setTokens(res.data.accessToken, res.data.refreshToken, res.data.expiresAt);
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    const refreshToken = this.storage.getRefreshToken();
    if (refreshToken) {
      // Fire-and-forget — don't block UI on this
      this.http.post(`${this.api}/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    // CRITICAL: close SignalR hubs BEFORE clearing the token so the next user
    // doesn't inherit a hub still authenticated with the old user's JWT.
    // Without this, messages they send arrive at the backend with the old
    // user's identity (SenderId mix-up reported in the chat).
    this.signalr.disconnectChat().catch(() => {});
    this.signalr.disconnectNotifications().catch(() => {});
    this.storage.clearTokens();
    this._currentUser.set(null);
    this.router.navigate(['/']);
  }

  getCurrentUser(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.api}/me`).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.storage.setUser(res.data);
          this._currentUser.set(res.data);
        }
      })
    );
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.api}/change-password`, data);
  }

  // Called by the JWT interceptor to get a new token without navigating
  getRefreshObservable(): Observable<ApiResponse<RefreshResponse>> {
    return this.refreshToken();
  }

  getDashboardPath(): string {
    const role = this._currentUser()?.role;
    const map: Record<UserRole, string> = {
      Admin:      '/admin/dashboard',
      Supervisor: '/supervisor/dashboard',
      Teacher:    '/teacher/dashboard',
      Student:    '/student/dashboard',
      Parent:     '/parent/dashboard',
    };
    return role ? (map[role] ?? '/') : '/';
  }

  getLoginPath(role?: UserRole): string {
    if (!role) return '/login/student';
    const map: Record<UserRole, string> = {
      Admin:      '/login/admin',
      Supervisor: '/login/supervisor',
      Teacher:    '/login/teacher',
      Student:    '/login/student',
      Parent:     '/login/parent',
    };
    return map[role];
  }
}
