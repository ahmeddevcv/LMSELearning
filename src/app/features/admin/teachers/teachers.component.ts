import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { TeacherUser } from '../../../core/models';
import { PHONE_PATTERN, PHONE_PLACEHOLDER, normalizePhone } from '../../../core/validators/phone';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent, ConfirmModalComponent, PaginationComponent, ResetPasswordModalComponent, FieldErrorComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'المعلمون' : 'Teachers' }}</h1>
          <p class="section-subtitle">{{ total() }} {{ isAr() ? 'معلم' : 'teachers' }}</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">
          <i class="bi bi-plus-lg"></i> {{ isAr() ? 'إضافة معلم' : 'Add Teacher' }}
        </button>
      </div>

      @if (createdPassword()) {
        <div class="alert alert-success alert-dismissible fade show mb-4" role="alert">
          <i class="bi bi-check-circle-fill me-2"></i>
          {{ isAr() ? 'تم إضافة المعلم بنجاح. كلمة المرور هي:' : 'Teacher added successfully. The password is:' }}
          <strong class="mx-2 font-monospace fs-5 user-select-all" dir="ltr" style="display: inline-block;">{{ createdPassword() }}</strong>
          <br><small>{{ isAr() ? 'يرجى نسخها وإرسالها للمعلم، حيث لن تظهر مرة أخرى.' : 'Please copy and send it to the teacher, as it will not be shown again.' }}</small>
          <button type="button" class="btn-close" (click)="createdPassword.set(null)"></button>
        </div>
      }

      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0 table-cards">
            <thead>
              <tr>
                <th>{{ isAr() ? 'الاسم' : 'Name' }}</th>
                <th>{{ isAr() ? 'البريد' : 'Email' }}</th>
                <th>{{ isAr() ? 'الهاتف' : 'Phone' }}</th>
                <th>{{ isAr() ? 'المادة' : 'Subject' }}</th>
                <th>{{ isAr() ? 'التقييم' : 'Rating' }}</th>
                <th>{{ isAr() ? 'الحالة' : 'Status' }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <app-skeleton type="table" [count]="8" [colCount]="7"/>
              } @else {
                @for (t of teachers(); track t.id) {
                  <tr>
                    <td [attr.data-label]="isAr() ? 'الاسم' : 'Name'">
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar" style="width:34px;height:34px;font-size:.8rem">{{ t.fullNameAr.charAt(0) }}</div>
                        <span class="fw-medium" style="font-size:.875rem">{{ isAr() ? t.fullNameAr : t.fullNameEn }}</span>
                      </div>
                    </td>
                    <td class="text-secondary" style="font-size:.85rem" [attr.data-label]="isAr() ? 'البريد' : 'Email'">{{ t.email }}</td>
                    <td class="text-secondary" style="font-size:.85rem" [attr.data-label]="isAr() ? 'الهاتف' : 'Phone'">{{ t.phoneNumber || t.phone }}</td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'المادة' : 'Subject'">{{ isAr() ? t.specializationAr : t.specializationEn }}</td>
                    <td [attr.data-label]="isAr() ? 'التقييم' : 'Rating'"><span style="color:var(--lms-warning);font-weight:600;font-size:.85rem">⭐ {{ t.averageRating?.toFixed(1) ?? '—' }}</span></td>
                    <td [attr.data-label]="isAr() ? 'الحالة' : 'Status'">
                      <span class="badge" [class]="t.isActive ? 'badge-active' : 'badge-inactive'">
                        {{ isAr() ? (t.isActive ? 'نشط' : 'موقف') : (t.isActive ? 'Active' : 'Inactive') }}
                      </span>
                    </td>
                    <td class="cell-actions">
                      <div class="d-flex gap-1">
                        <button class="btn btn-sm btn-outline-primary" (click)="openForm(t)" [title]="isAr() ? 'تعديل' : 'Edit'"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-warning" (click)="openResetPassword(t)" [title]="isAr() ? 'إعادة تعيين كلمة المرور' : 'Reset Password'"><i class="bi bi-key"></i></button>
                        @if (t.isActive) {
                          <button class="btn btn-sm btn-outline-danger" (click)="confirmToggle(t)" [title]="isAr() ? 'تعطيل' : 'Deactivate'"><i class="bi bi-x-circle"></i></button>
                        } @else {
                          <button class="btn btn-sm btn-outline-success" (click)="confirmToggle(t)" [title]="isAr() ? 'تنشيط' : 'Activate'"><i class="bi bi-check-circle"></i></button>
                        }
                      </div>
                    </td>
                  </tr>
                }
                @if (!teachers().length) {
                  <tr><td colspan="7" class="cell-empty text-center py-5 text-secondary">{{ isAr() ? 'لا يوجد معلمون' : 'No teachers found' }}</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
        <app-pagination [currentPage]="page()" [totalPages]="totalPages()" [totalCount]="total()" [pageSize]="20" (pageChange)="load($event)"/>
      </div>
    </div>

    @if (showForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editing() ? (isAr() ? 'تعديل المعلم' : 'Edit Teacher') : (isAr() ? 'إضافة معلم' : 'Add Teacher') }}</h5>
              <button type="button" class="btn-close" (click)="closeForm()"></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'الاسم (عربي)' : 'Arabic Name' }}</label>
                    <input formControlName="fullNameAr" class="form-control" placeholder="أحمد محمد">
                    <app-field-error [c]="form.get('fullNameAr')" [label]="isAr() ? 'الاسم بالعربي' : 'Arabic Name'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'الاسم (إنجليزي)' : 'English Name' }}</label>
                    <input formControlName="fullNameEn" class="form-control" placeholder="Ahmed Mohamed">
                    <app-field-error [c]="form.get('fullNameEn')" [label]="isAr() ? 'الاسم بالإنجليزي' : 'English Name'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'البريد' : 'Email' }}</label>
                    <input formControlName="email" type="email" class="form-control" placeholder="teacher@lms.com" autocomplete="off">
                    <app-field-error [c]="form.get('email')" [label]="isAr() ? 'البريد الإلكتروني' : 'Email'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'الهاتف (مع كود الدولة)' : 'Phone (with country code)' }}</label>
                    <input formControlName="phoneNumber" type="tel" class="form-control" dir="ltr" [placeholder]="phonePlaceholder" autocomplete="new-phone">
                    <app-field-error [c]="form.get('phoneNumber')" [label]="isAr() ? 'الهاتف' : 'Phone'"/>
                    <small class="text-secondary d-block mt-1" style="font-size:.72rem">{{ isAr() ? 'مثال: +201129841926 — بكود الدولة وبدون صفر' : 'e.g. +201129841926 — include country code, no leading 0' }}</small>
                  </div>
                  <div class="col-12">
                    <label class="form-label small">
                      {{ isAr() ? 'كلمة المرور' : 'Password' }}
                      @if (editing()) { <span class="text-secondary" style="font-size: 0.75rem;">{{ isAr() ? '(اتركها فارغة إذا لم ترد تغييرها)' : '(Leave blank to keep unchanged)' }}</span> }
                    </label>
                    <div class="input-group">
                      <input formControlName="password" [type]="showPassword() ? 'text' : 'password'" class="form-control" [placeholder]="editing() ? '••••••••' : ''" autocomplete="new-password">
                      <button type="button" class="btn btn-outline-secondary" (click)="showPassword.set(!showPassword())" tabindex="-1">
                        <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
                      </button>
                    </div>
                    <app-field-error [c]="form.get('password')" [label]="isAr() ? 'كلمة المرور' : 'Password'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'المادة (عربي)' : 'Subject (AR)' }}</label>
                    <input formControlName="specializationAr" class="form-control" placeholder="الرياضيات">
                    <app-field-error [c]="form.get('specializationAr')" [label]="isAr() ? 'المادة بالعربي' : 'Subject (AR)'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'المادة (إنجليزي)' : 'Subject (EN)' }}</label>
                    <input formControlName="specializationEn" class="form-control" placeholder="Mathematics">
                    <app-field-error [c]="form.get('specializationEn')" [label]="isAr() ? 'المادة بالإنجليزي' : 'Subject (EN)'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'الراتب' : 'Salary' }}</label>
                    <input formControlName="baseSalary" type="number" class="form-control" placeholder="5000" min="0">
                    <app-field-error [c]="form.get('baseSalary')" [label]="isAr() ? 'الراتب' : 'Salary'"/>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="closeForm()">{{ isAr() ? 'إلغاء' : 'Cancel' }}</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                  {{ isAr() ? 'حفظ' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <app-confirm-modal [open]="toggleModal()"
      [titleAr]="toggleTarget()?.isActive ? 'تعطيل المعلم' : 'تنشيط المعلم'"
      [titleEn]="toggleTarget()?.isActive ? 'Deactivate Teacher' : 'Activate Teacher'"
      [messageAr]="'هل تريد ' + (toggleTarget()?.isActive ? 'تعطيل ' : 'تنشيط ') + (toggleTarget()?.fullNameAr ?? '') + '؟'"
      [messageEn]="'Do you want to ' + (toggleTarget()?.isActive ? 'deactivate ' : 'activate ') + (toggleTarget()?.fullNameEn ?? '') + '?'"
      [loading]="saving()" (confirm)="doToggle()" (cancelled)="toggleModal.set(false)"/>

    <app-reset-password-modal
      [open]="resetPwdOpen()"
      [userId]="resetPwdTarget()?.id ?? ''"
      [userName]="(isAr() ? resetPwdTarget()?.fullNameAr : resetPwdTarget()?.fullNameEn) ?? ''"
      (closed)="resetPwdOpen.set(false)"/>
  `
})
export class TeachersComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast    = inject(ToastService);
  private readonly fb       = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly teachers   = signal<TeacherUser[]>([]);
  readonly loading    = signal(true);
  readonly saving     = signal(false);
  readonly showForm   = signal(false);
  readonly toggleModal = signal(false);
  readonly editing    = signal<TeacherUser | null>(null);
  readonly toggleTarget = signal<TeacherUser | null>(null);
  readonly resetPwdOpen    = signal(false);
  readonly resetPwdTarget  = signal<TeacherUser | null>(null);
  readonly page       = signal(1);
  readonly totalPages = signal(1);
  readonly total      = signal(0);
  readonly showPassword = signal(false);
  readonly createdPassword = signal<string | null>(null);
  readonly phonePlaceholder = PHONE_PLACEHOLDER;

  // Validators mirror backend CreateTeacherValidator:
  //   - FullNameAr/En: NotEmpty, MaxLength(200)
  //   - Email: NotEmpty, EmailAddress, MaxLength(256)
  //   - Password: NotEmpty, MinLength(8) — toggled off on edit (see openForm)
  //   - SpecializationAr/En: NotEmpty, MaxLength(500)
  //   - BaseSalary: >= 0
  form = this.fb.group({
    fullNameAr: ['', [Validators.required, Validators.maxLength(200)]],
    fullNameEn: ['', [Validators.required, Validators.maxLength(200)]],
    email:      ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phoneNumber:['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password:   [''],
    specializationAr: ['', [Validators.required, Validators.maxLength(500)]],
    specializationEn: ['', [Validators.required, Validators.maxLength(500)]],
    baseSalary: [0, [Validators.min(0)]],
  });

  ngOnInit() { this.load(1); }

  load(p: number) {
    this.loading.set(true); this.page.set(p);
    this.adminSvc.getTeachers(p, 20).subscribe(r => {
      if (r.success && r.data) { this.teachers.set(r.data.items); this.total.set(r.data.totalCount); this.totalPages.set(r.data.totalPages); }
      this.loading.set(false);
    });
  }

  openForm(t?: TeacherUser) {
    this.editing.set(t ?? null);
    this.form.reset();
    if (t) { this.form.patchValue(t as any); this.form.get('password')?.clearValidators(); }
    else    { this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]); }
    this.form.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }
  closeForm() { this.showForm.set(false); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    // Build payload — on edit, drop empty/null `password` so the backend's
    // "Password required" validator doesn't reject the update.
    const payload: any = { ...this.form.value };
    payload.phoneNumber = normalizePhone(payload.phoneNumber);
    if (this.editing() && (payload.password == null || payload.password === '')) {
      delete payload.password;
    }
    const obs = this.editing()
      ? this.adminSvc.updateTeacher(this.editing()!.id, payload)
      : this.adminSvc.createTeacher(payload);
    obs.subscribe({
      next: r => { 
        this.saving.set(false); 
        if (r.success) { 
          this.toast.success('تم','Saved'); 
          
          if (!this.editing() && (r.data as any)?.tempPassword) {
            this.createdPassword.set((r.data as any).tempPassword);
          } else {
            this.createdPassword.set(null);
          }

          this.closeForm(); 
          this.load(this.page()); 
        } 
      },
      error: () => this.saving.set(false)
    });
  }

  openResetPassword(t: TeacherUser) { this.resetPwdTarget.set(t); this.resetPwdOpen.set(true); }

  confirmToggle(t: TeacherUser) { this.toggleTarget.set(t); this.toggleModal.set(true); }
  doToggle() {
    const target = this.toggleTarget();
    if (!target) return;
    this.saving.set(true);
    
    const obs = target.isActive 
      ? this.adminSvc.deactivateTeacher(target.id) 
      : this.adminSvc.activateTeacher(target.id);

    obs.subscribe({
      next: r => { this.saving.set(false); this.toggleModal.set(false); if (r.success) { this.toast.success('تم','Done'); this.load(this.page()); } },
      error: () => { this.saving.set(false); this.toggleModal.set(false); }
    });
  }
}
