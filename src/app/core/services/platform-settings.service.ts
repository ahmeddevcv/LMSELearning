import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LanguageService } from './language.service';

export interface PlatformInfo {
  nameAr: string;
  nameEn: string;
  supportEmail: string;
  whatsappNumber: string;
}

const DEFAULTS: PlatformInfo = {
  nameAr: 'منصة التعليم',
  nameEn: 'LMS Platform',
  supportEmail: 'support@lms.com',
  whatsappNumber: '',
};

@Injectable({ providedIn: 'root' })
export class PlatformSettingsService {
  private readonly http = inject(HttpClient);
  private readonly lang = inject(LanguageService);

  private readonly _info = signal<PlatformInfo>(DEFAULTS);

  /** Read-only signal exposing the full info object. */
  readonly info = this._info.asReadonly();

  /** Computed signal returning the current language-aware platform name. */
  readonly name = computed(() => this.lang.isRtl() ? this._info().nameAr : this._info().nameEn);

  /** Fetch latest branding from the public endpoint. Called on app start and after admin saves. */
  reload(): void {
    this.http.get<{ success: boolean; data: PlatformInfo }>(
      `${environment.apiUrl}/catalog/platform-info`
    ).subscribe({
      next: r => { if (r?.success && r.data) this._info.set({ ...DEFAULTS, ...r.data }); },
      error: () => { /* keep defaults */ },
    });
  }
}
