import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container-fixed">
      @for (t of toasts(); track t.id) {
        <div class="lms-toast" [class]="'toast-' + t.type">
          <span class="fs-5">{{ icons[t.type] }}</span>
          <div class="flex-grow-1">
            @if (title(t)) {
              <div class="fw-semibold" style="font-size:.875rem">{{ title(t) }}</div>
            }
            @if (msg(t)) {
              <div style="font-size:.8rem;color:var(--text-secondary)">{{ msg(t) }}</div>
            }
          </div>
          <button type="button" class="btn-close btn-close-sm ms-2"
                  (click)="svc.dismiss(t.id)"></button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  readonly svc  = inject(ToastService);
  readonly lang = inject(LanguageService);
  readonly toasts = this.svc.toasts;
  readonly icons: Record<string, string> = {
    success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'
  };
  title = (t: Toast) => this.lang.currentLang() === 'ar' ? t.titleAr : t.titleEn;
  msg   = (t: Toast) => this.lang.currentLang() === 'ar' ? (t.messageAr ?? '') : (t.messageEn ?? '');
}
