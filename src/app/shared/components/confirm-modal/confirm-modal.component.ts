import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <!-- Backdrop -->
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <!-- Modal -->
      <div class="modal fade show d-block" tabindex="-1" style="z-index:1056">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-body text-center p-5">
              <div class="mb-3" style="font-size:3rem">{{ danger ? '🗑️' : '⚠️' }}</div>
              <h5 class="fw-bold mb-2">{{ title() }}</h5>
              @if (message()) {
                <p class="text-secondary mb-4">{{ message() }}</p>
              }
              <div class="d-flex gap-3 justify-content-center">
                <button type="button" class="btn btn-outline-secondary px-4"
                        (click)="cancelled.emit()" [disabled]="loading">
                  {{ cancelLabel() }}
                </button>
                <button type="button"
                        [class]="danger ? 'btn btn-danger px-4' : 'btn btn-primary px-4'"
                        [disabled]="loading"
                        (click)="confirm.emit()">
                  @if (loading) {
                    <span class="spinner-border spinner-border-sm me-1"></span>
                  }
                  {{ confirmLabel() }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  private readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  @Input() open = false;
  @Input() titleAr = 'هل أنت متأكد؟';
  @Input() titleEn = 'Are you sure?';
  @Input() messageAr = '';
  @Input() messageEn = '';
  @Input() confirmLabelAr = 'تأكيد';
  @Input() confirmLabelEn = 'Confirm';
  @Input() cancelLabelAr  = 'إلغاء';
  @Input() cancelLabelEn  = 'Cancel';
  @Input() danger = true;
  @Input() loading = false;
  @Output() confirm   = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  // Pick the language-appropriate text. When an English value isn't supplied by the
  // caller, fall back to the Arabic one so older callers keep working.
  title()        { return this.isAr() ? this.titleAr        : (this.titleEn        || this.titleAr); }
  message()      { return this.isAr() ? this.messageAr      : (this.messageEn      || this.messageAr); }
  confirmLabel() { return this.isAr() ? this.confirmLabelAr : (this.confirmLabelEn || this.confirmLabelAr); }
  cancelLabel()  { return this.isAr() ? this.cancelLabelAr  : (this.cancelLabelEn  || this.cancelLabelAr); }
}
