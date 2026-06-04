import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Reusable modal for admin to reset a user's password (Teacher / Supervisor / Student).
 *
 * Two phases:
 *   1. Form: admin chooses to auto-generate OR enter a custom password
 *   2. Result: shows the resulting password so admin can copy + share it
 */
@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-key-fill me-2 text-warning"></i>
                {{ isAr() ? 'إعادة تعيين كلمة المرور' : 'Reset Password' }}
              </h5>
              <button type="button" class="btn-close" (click)="close()"></button>
            </div>

            <div class="modal-body">
              <p class="text-secondary mb-3" style="font-size:.88rem">
                {{ isAr() ? 'إعادة تعيين كلمة مرور لـ' : 'Reset password for' }}
                <strong>{{ userName }}</strong>
              </p>

              @if (!result()) {
                <!-- Phase 1 — choose method -->
                <div class="form-check mb-2">
                  <input class="form-check-input" type="radio" id="rp-auto" [(ngModel)]="mode" value="auto">
                  <label class="form-check-label" for="rp-auto">
                    {{ isAr() ? 'توليد كلمة مرور تلقائياً' : 'Auto-generate a random password' }}
                  </label>
                </div>
                <div class="form-check mb-3">
                  <input class="form-check-input" type="radio" id="rp-custom" [(ngModel)]="mode" value="custom">
                  <label class="form-check-label" for="rp-custom">
                    {{ isAr() ? 'إدخال كلمة مرور يدوياً' : 'Enter a custom password' }}
                  </label>
                </div>

                @if (mode === 'custom') {
                  <input type="text" class="form-control"
                         [(ngModel)]="customPassword"
                         [placeholder]="isAr() ? 'كلمة المرور الجديدة (8 أحرف على الأقل)' : 'New password (min 8 chars)'"
                         autocomplete="off">
                  <small class="text-secondary d-block mt-1" style="font-size:.72rem">
                    {{ isAr() ? 'استخدم كلمة قوية: أحرف كبيرة وصغيرة، أرقام، ورمز خاص' : 'Use a strong password: uppercase, lowercase, digit, special char' }}
                  </small>
                }

                <div class="alert alert-warning mt-3 mb-0 d-flex align-items-start gap-2" style="font-size:.78rem">
                  <i class="bi bi-exclamation-triangle-fill mt-1"></i>
                  <span>{{ isAr()
                    ? 'سيتم تسجيل خروج المستخدم من جميع الأجهزة. شارك كلمة المرور الجديدة معه بأمان.'
                    : 'The user will be logged out from all devices. Share the new password securely.' }}</span>
                </div>
              } @else {
                <!-- Phase 2 — show result -->
                <div class="alert alert-success d-flex flex-column gap-2">
                  <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-check-circle-fill"></i>
                    <strong>{{ isAr() ? 'تم بنجاح' : 'Success' }}</strong>
                  </div>
                  <div style="font-size:.85rem">
                    {{ isAr() ? 'كلمة المرور الجديدة:' : 'New password:' }}
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <code class="flex-grow-1 p-2 rounded user-select-all"
                          style="background:#fff;border:1px solid var(--border-color);font-size:1rem"
                          dir="ltr">{{ result() }}</code>
                    <button class="btn btn-outline-primary btn-sm" (click)="copy()" type="button">
                      <i class="bi" [class]="copied() ? 'bi-check-lg' : 'bi-clipboard'"></i>
                    </button>
                  </div>
                  <small class="text-secondary" style="font-size:.72rem">
                    {{ isAr() ? 'لن تظهر مرة أخرى — انسخها الآن.' : "Won't be shown again — copy it now." }}
                  </small>
                </div>
              }
            </div>

            <div class="modal-footer">
              @if (!result()) {
                <button class="btn btn-outline-secondary" (click)="close()" type="button">
                  {{ isAr() ? 'إلغاء' : 'Cancel' }}
                </button>
                <button class="btn btn-warning" (click)="submit()" type="button" [disabled]="saving()">
                  @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  <i class="bi bi-key-fill me-1"></i>
                  {{ isAr() ? 'إعادة التعيين' : 'Reset' }}
                </button>
              } @else {
                <button class="btn btn-primary" (click)="close()" type="button">
                  {{ isAr() ? 'تم' : 'Done' }}
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ResetPasswordModalComponent {
  @Input() open = false;
  @Input() userId = '';
  @Input() userName = '';
  @Output() closed = new EventEmitter<void>();

  private readonly adminSvc = inject(AdminService);
  private readonly lang = inject(LanguageService);
  private readonly toast = inject(ToastService);
  readonly isAr = this.lang.isRtl;

  mode: 'auto' | 'custom' = 'auto';
  customPassword = '';
  readonly saving = signal(false);
  readonly result = signal<string | null>(null);
  readonly copied = signal(false);

  submit() {
    if (!this.userId) return;
    if (this.mode === 'custom' && this.customPassword.trim().length < 8) {
      this.toast.error('كلمة المرور قصيرة', 'Password too short');
      return;
    }
    this.saving.set(true);
    this.adminSvc.resetUserPassword(this.userId, this.mode === 'custom' ? this.customPassword : undefined)
      .subscribe({
        next: r => {
          this.saving.set(false);
          if (r.success && r.data?.tempPassword) {
            this.result.set(r.data.tempPassword);
          }
        },
        error: () => this.saving.set(false)
      });
  }

  copy() {
    const pwd = this.result();
    if (!pwd) return;
    navigator.clipboard?.writeText(pwd).then(() => {
      this.copied.set(true);
      this.toast.success('تم النسخ', 'Copied');
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  close() {
    this.result.set(null);
    this.customPassword = '';
    this.mode = 'auto';
    this.copied.set(false);
    this.closed.emit();
  }
}
