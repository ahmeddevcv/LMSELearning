import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SupervisorPermissionType, User } from '../models';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';

/**
 * Supervisor-specific permission state.
 *
 * Loads permissions from /auth/me on demand and exposes them as signals so
 * the sidebar and dashboard can react to permission changes (e.g. after the
 * admin updates a supervisor's grant). Components ask `has('ViewStudents')`
 * to gate visibility — they never hard-code the enum strings.
 */
@Injectable({ providedIn: 'root' })
export class SupervisorPermissionsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly storage = inject(StorageService);

  /** Internal signal — populated from /auth/me. */
  private readonly _permissions = signal<SupervisorPermissionType[]>(
    this.auth.currentUser$()?.permissions ?? []
  );

  readonly permissions = this._permissions.asReadonly();

  /** Convenience flag — true when the current supervisor has at least one permission. */
  readonly hasAny = computed(() => this._permissions().length > 0);

  /** Returns true if the current supervisor has the given permission. */
  has(perm: SupervisorPermissionType): boolean {
    return this._permissions().includes(perm);
  }

  /**
   * Reload permissions from /auth/me — call after login or when a permission
   * change may have happened (e.g. admin granted/revoked perms while supervisor was logged in).
   */
  reload(): void {
    if (!this.auth.isSupervisor()) {
      this._permissions.set([]);
      return;
    }
    this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`).pipe(
      tap(res => {
        if (res?.success && res.data) {
          this._permissions.set(res.data.permissions ?? []);
          // keep the cached user in sync so refresh-on-reload still works
          this.storage.setUser(res.data);
        }
      })
    ).subscribe({ error: () => { /* keep previous value */ } });
  }
}
