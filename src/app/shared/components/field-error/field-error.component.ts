import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { LanguageService } from '../../../core/services/language.service';

/**
 * Renders client-side validation errors under a form input — Angular's
 * equivalent of MVC's `asp-validation-for`. Messages mirror the backend
 * FluentValidation rules so the user sees the same wording on both sides.
 *
 * Usage:
 *   <input formControlName="email" class="form-control" />
 *   <app-field-error [c]="form.get('email')!" [label]="isAr() ? 'البريد' : 'Email'"/>
 *
 * Pass `label` to inject the field name into "required"/"invalid" messages.
 * `min`/`max` lengths come from the validator metadata automatically.
 */
@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (c?.touched && c?.errors; as errs) {
      <small class="text-danger d-block mt-1 field-error-msg" style="font-size:.78rem">
        @if (errs['required']) {
          {{ isAr() ? (label ? label + ' مطلوب' : 'هذا الحقل مطلوب') : (label ? label + ' is required' : 'This field is required') }}
        } @else if (errs['email']) {
          {{ isAr() ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address' }}
        } @else if (errs['minlength']) {
          {{ isAr() ? 'الحد الأدنى ' + errs['minlength'].requiredLength + ' حرف' : 'Minimum ' + errs['minlength'].requiredLength + ' characters' }}
        } @else if (errs['maxlength']) {
          {{ isAr() ? 'الحد الأقصى ' + errs['maxlength'].requiredLength + ' حرف' : 'Maximum ' + errs['maxlength'].requiredLength + ' characters' }}
        } @else if (errs['min']) {
          {{ isAr() ? 'القيمة الأقل ' + errs['min'].min : 'Minimum value: ' + errs['min'].min }}
        } @else if (errs['max']) {
          {{ isAr() ? 'القيمة الأعلى ' + errs['max'].max : 'Maximum value: ' + errs['max'].max }}
        } @else if (errs['pattern']) {
          {{ isAr() ? 'التنسيق غير صحيح' : 'Invalid format' }}
        } @else if (errs['matchPassword']) {
          {{ isAr() ? 'كلمة المرور غير متطابقة' : 'Passwords do not match' }}
        } @else {
          {{ isAr() ? 'قيمة غير صحيحة' : 'Invalid value' }}
        }
      </small>
    }
  `,
  styles: [`
    .field-error-msg { animation: fieldErrFadeIn .15s ease; }
    @keyframes fieldErrFadeIn {
      from { opacity: 0; transform: translateY(-2px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FieldErrorComponent {
  @Input() c: AbstractControl | null = null;
  @Input() label = '';

  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;
}
