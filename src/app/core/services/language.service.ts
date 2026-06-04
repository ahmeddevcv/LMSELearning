import { Injectable, inject, signal, effect } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly storage   = inject(StorageService);

  readonly currentLang = signal<'ar' | 'en'>(this.storage.getLanguage());
  readonly isRtl       = signal<boolean>(this.storage.getLanguage() === 'ar');

  constructor() {
    // Apply language on init
    this.applyLanguage(this.currentLang());

    // React to changes
    effect(() => {
      const lang = this.currentLang();
      this.applyLanguage(lang);
      this.storage.setLanguage(lang);
    }, { allowSignalWrites: true });
  }

  toggle(): void {
    this.currentLang.update(l => l === 'ar' ? 'en' : 'ar');
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.currentLang.set(lang);
  }

  private applyLanguage(lang: 'ar' | 'en'): void {
    this.translate.use(lang);
    const isRtl = lang === 'ar';
    this.isRtl.set(isRtl);
    document.documentElement.lang = lang;
    document.documentElement.dir  = isRtl ? 'rtl' : 'ltr';
    // Switch font class
    document.body.classList.toggle('font-arabic', isRtl);
    document.body.classList.toggle('font-latin',  !isRtl);
  }

  /** Helper: get the localized value from {nameAr, nameEn} objects */
  get<T extends Record<string, any>>(obj: T, arKey: keyof T, enKey: keyof T): string {
    return (this.currentLang() === 'ar' ? obj[arKey] : obj[enKey]) as string ?? '';
  }
}
