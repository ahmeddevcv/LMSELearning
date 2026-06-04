import { Injectable } from '@angular/core';

const KEYS = {
  ACCESS_TOKEN:  'lms_access_token',
  REFRESH_TOKEN: 'lms_refresh_token',
  EXPIRES_AT:    'lms_expires_at',
  CURRENT_USER:  'lms_current_user',
  LANGUAGE:      'lms_language',
  DARK_MODE:     'lms_dark_mode',
  SIDEBAR:       'lms_sidebar_collapsed',
} as const;

@Injectable({ providedIn: 'root' })
export class StorageService {
  /* ── tokens ── */
  setTokens(access: string, refresh: string, expiresAt: string): void {
    localStorage.setItem(KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(KEYS.REFRESH_TOKEN, refresh);
    localStorage.setItem(KEYS.EXPIRES_AT, expiresAt);
  }
  getAccessToken  = () => localStorage.getItem(KEYS.ACCESS_TOKEN);
  getRefreshToken = () => localStorage.getItem(KEYS.REFRESH_TOKEN);
  getExpiresAt    = () => localStorage.getItem(KEYS.EXPIRES_AT);

  clearTokens(): void {
    [KEYS.ACCESS_TOKEN, KEYS.REFRESH_TOKEN, KEYS.EXPIRES_AT, KEYS.CURRENT_USER]
      .forEach(k => localStorage.removeItem(k));
  }

  isTokenExpired(): boolean {
    const exp = this.getExpiresAt();
    if (!exp) return true;
    // Subtract 60 seconds buffer for proactive refresh
    return new Date(exp).getTime() - 60_000 < Date.now();
  }

  /* ── user ── */
  setUser(user: object): void {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  }
  getUser<T>(): T | null {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) as T : null;
  }

  /* ── preferences ── */
  setLanguage(lang: 'ar' | 'en'): void { localStorage.setItem(KEYS.LANGUAGE, lang); }
  getLanguage(): 'ar' | 'en' {
    return (localStorage.getItem(KEYS.LANGUAGE) as 'ar' | 'en') ?? 'ar';
  }

  setDarkMode(on: boolean): void { localStorage.setItem(KEYS.DARK_MODE, String(on)); }
  getDarkMode(): boolean { return localStorage.getItem(KEYS.DARK_MODE) === 'true'; }

  setSidebarCollapsed(v: boolean): void { localStorage.setItem(KEYS.SIDEBAR, String(v)); }
  getSidebarCollapsed(): boolean { return localStorage.getItem(KEYS.SIDEBAR) === 'true'; }
}
