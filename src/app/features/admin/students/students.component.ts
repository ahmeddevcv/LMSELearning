import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService, CatalogService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { StudentUser, Subject } from '../../../core/models';
import { PHONE_PATTERN, PHONE_PLACEHOLDER, normalizePhone } from '../../../core/validators/phone';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent, ConfirmModalComponent, PaginationComponent, ResetPasswordModalComponent, FieldErrorComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الطلاب' : 'Students' }}</h1>
          <p class="section-subtitle">{{ total() }} {{ isAr() ? 'طالب' : 'students' }}</p>
        </div>
        <button class="btn btn-primary" (click)="openAddForm()">
          <i class="bi bi-plus-lg"></i> {{ isAr() ? 'إضافة طالب' : 'Add Student' }}
        </button>
      </div>

      @if (createdPassword()) {
        <div class="alert alert-success alert-dismissible fade show mb-4" role="alert">
          <i class="bi bi-check-circle-fill me-2"></i>
          {{ isAr() ? 'تم إضافة الطالب بنجاح. كلمة المرور هي:' : 'Student added successfully. The password is:' }}
          <strong class="mx-2 font-monospace fs-5 user-select-all" dir="ltr" style="display: inline-block;">{{ createdPassword() }}</strong>
          <br><small>{{ isAr() ? 'يرجى نسخها وإرسالها للطالب، حيث لن تظهر مرة أخرى.' : 'Please copy and send it to the student, as it will not be shown again.' }}</small>
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
                <th>{{ isAr() ? 'الصف' : 'Grade' }}</th>
                <th>{{ isAr() ? 'الاشتراكات النشطة' : 'Active Subs' }}</th>
                <th>{{ isAr() ? 'الحالة' : 'Status' }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <app-skeleton type="table" [count]="8" [colCount]="7"/>
              } @else {
                @for (s of students(); track s.id) {
                  <tr>
                    <td [attr.data-label]="isAr() ? 'الاسم' : 'Name'">
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar" style="width:34px;height:34px;font-size:.8rem">{{ s.fullNameAr.charAt(0) }}</div>
                        <span class="fw-medium" style="font-size:.875rem">{{ isAr() ? s.fullNameAr : s.fullNameEn }}</span>
                      </div>
                    </td>
                    <td class="text-secondary" style="font-size:.85rem" [attr.data-label]="isAr() ? 'البريد' : 'Email'">{{ s.email }}</td>
                    <td class="text-secondary" style="font-size:.85rem" [attr.data-label]="isAr() ? 'الهاتف' : 'Phone'">{{ s.phoneNumber || s.phone }}</td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'الصف' : 'Grade'">{{ getGradeName(s.gradeLevel) }}</td>
                    <td [attr.data-label]="isAr() ? 'الاشتراكات النشطة' : 'Active Subs'"><span class="badge bg-info text-dark" style="font-size:.85rem">{{ s.activeSubscriptions }}</span></td>
                    <td [attr.data-label]="isAr() ? 'الحالة' : 'Status'">
                      <span class="badge" [class]="s.isActive ? 'badge-active' : 'badge-inactive'">
                        {{ isAr() ? (s.isActive ? 'نشط' : 'موقف') : (s.isActive ? 'Active' : 'Inactive') }}
                      </span>
                    </td>
                    <td class="cell-actions">
                      <div class="d-flex gap-1 justify-content-end">
                        <button class="btn btn-sm btn-outline-warning" (click)="openGrantModal(s)" [title]="isAr() ? 'منح اشتراك' : 'Grant Subscription'"><i class="bi bi-gift"></i></button>
                        <button class="btn btn-sm btn-outline-primary" (click)="openEditForm(s)" [title]="isAr() ? 'تعديل بيانات الطالب' : 'Edit Student'"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-info" (click)="openParentModal(s)" [title]="isAr() ? 'بيانات ولي الأمر' : 'Parent Info'"><i class="bi bi-people"></i></button>
                        <button class="btn btn-sm btn-outline-warning" (click)="openResetPassword(s)" [title]="isAr() ? 'إعادة تعيين كلمة مرور الطالب' : 'Reset Student Password'"><i class="bi bi-key"></i></button>
                        @if (s.isActive) {
                          <button class="btn btn-sm btn-outline-danger" (click)="confirmToggle(s)" [title]="isAr() ? 'تعطيل' : 'Deactivate'"><i class="bi bi-x-circle"></i></button>
                        } @else {
                          <button class="btn btn-sm btn-outline-success" (click)="confirmToggle(s)" [title]="isAr() ? 'تنشيط' : 'Activate'"><i class="bi bi-check-circle"></i></button>
                        }
                      </div>
                    </td>
                  </tr>
                }
                @if (!students().length) {
                  <tr><td colspan="7" class="cell-empty text-center py-5 text-secondary">{{ isAr() ? 'لا يوجد طلاب' : 'No students found' }}</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
        <app-pagination [currentPage]="page()" [totalPages]="totalPages()" [totalCount]="total()" [pageSize]="20" (pageChange)="load($event)"/>
      </div>
    </div>

    <!-- Student Form Modal -->
    @if (showForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editing() ? (isAr() ? 'تعديل الطالب' : 'Edit Student') : (isAr() ? 'إضافة طالب (منحة)' : 'Add Student (Scholarship)') }}</h5>
              <button type="button" class="btn-close" (click)="closeForm()"></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="modal-body">
                <h6 class="mb-3 border-bottom pb-2 text-primary">{{ isAr() ? 'بيانات الطالب' : 'Student Data' }}</h6>
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
                  @if (!editing()) {
                    <div class="col-sm-6">
                      <label class="form-label small">{{ isAr() ? 'البريد الإلكتروني' : 'Email' }}</label>
                      <input formControlName="email" type="email" class="form-control" placeholder="student@example.com">
                      <app-field-error [c]="form.get('email')" [label]="isAr() ? 'البريد الإلكتروني' : 'Email'"/>
                    </div>
                  }
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'الهاتف (مع كود الدولة)' : 'Phone (with country code)' }}</label>
                    <input formControlName="phoneNumber" type="tel" class="form-control" dir="ltr" [placeholder]="phonePlaceholder">
                    <app-field-error [c]="form.get('phoneNumber')" [label]="isAr() ? 'الهاتف' : 'Phone'"/>
                    <small class="text-secondary d-block mt-1" style="font-size:.72rem">{{ isAr() ? 'مثال: +201129841926 — بكود الدولة وبدون صفر' : 'e.g. +201129841926 — include country code, no leading 0' }}</small>
                  </div>
                  @if (!editing()) {
                    <div class="col-sm-6">
                      <label class="form-label small">{{ isAr() ? 'المنهج' : 'Curriculum' }}</label>
                      <select formControlName="curriculum" class="form-select">
                        <option value="Egyptian">{{ isAr() ? 'المصري' : 'Egyptian' }}</option>
                        <option value="Gulf">{{ isAr() ? 'الخليجي' : 'Gulf' }}</option>
                        <option value="IG">{{ isAr() ? 'IG' : 'IG' }}</option>
                        <option value="American">{{ isAr() ? 'American' : 'American' }}</option>
                      </select>
                      <app-field-error [c]="form.get('curriculum')" [label]="isAr() ? 'المنهج' : 'Curriculum'"/>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small">{{ isAr() ? 'الصف' : 'Grade Level' }}</label>
                      <select formControlName="gradeLevel" class="form-select">
                        @for (g of grades; track g) {
                          <option [value]="g">{{ g }}</option>
                        }
                      </select>
                      <app-field-error [c]="form.get('gradeLevel')" [label]="isAr() ? 'الصف' : 'Grade Level'"/>
                    </div>
                  }
                </div>

                @if (!editing()) {
                  <h6 class="mt-4 mb-3 border-bottom pb-2 text-primary">{{ isAr() ? 'بيانات ولي الأمر' : 'Parent Data' }}</h6>
                  <div class="row g-3">
                    <div class="col-sm-6">
                      <label class="form-label small">{{ isAr() ? 'الاسم (عربي)' : 'Arabic Name' }}</label>
                      <input formControlName="parentFullNameAr" class="form-control" placeholder="محمد محمود">
                      <app-field-error [c]="form.get('parentFullNameAr')" [label]="isAr() ? 'اسم ولي الأمر بالعربي' : 'Parent Arabic Name'"/>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small">{{ isAr() ? 'الاسم (إنجليزي)' : 'English Name' }}</label>
                      <input formControlName="parentFullNameEn" class="form-control" placeholder="Mohamed Mahmoud">
                      <app-field-error [c]="form.get('parentFullNameEn')" [label]="isAr() ? 'اسم ولي الأمر بالإنجليزي' : 'Parent English Name'"/>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small">{{ isAr() ? 'البريد الإلكتروني' : 'Email' }}</label>
                      <input formControlName="parentEmail" type="email" class="form-control" placeholder="parent@example.com">
                      <app-field-error [c]="form.get('parentEmail')" [label]="isAr() ? 'بريد ولي الأمر' : 'Parent Email'"/>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small">{{ isAr() ? 'واتساب (مع كود الدولة)' : 'WhatsApp (with country code)' }}</label>
                      <input formControlName="parentWhatsApp" type="tel" class="form-control" dir="ltr" [placeholder]="phonePlaceholder">
                      <app-field-error [c]="form.get('parentWhatsApp')" [label]="isAr() ? 'واتساب ولي الأمر' : 'Parent WhatsApp'"/>
                      <small class="text-secondary d-block mt-1" style="font-size:.72rem">{{ isAr() ? 'مثال: +201129841926 — بكود الدولة وبدون صفر' : 'e.g. +201129841926 — include country code, no leading 0' }}</small>
                    </div>
                  </div>
                }
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

    <!-- Grant Subscription Modal -->
    @if (showGrantModal()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-success"><i class="bi bi-gift me-2"></i> {{ isAr() ? 'منح اشتراك مجاني' : 'Grant Free Subscription' }}</h5>
              <button type="button" class="btn-close" (click)="showGrantModal.set(false)"></button>
            </div>
            <form [formGroup]="grantForm" (ngSubmit)="grantSubscription()">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">{{ isAr() ? 'الطالب' : 'Student' }}</label>
                  <input class="form-control bg-light" [value]="isAr() ? grantTarget()?.fullNameAr : grantTarget()?.fullNameEn" readonly>
                </div>
                <div class="mb-3">
                  <label class="form-label">{{ isAr() ? 'المادة' : 'Subject' }}</label>
                  <select formControlName="subjectId" class="form-select">
                    <option value="" disabled>{{ isAr() ? 'اختر المادة...' : 'Select Subject...' }}</option>
                    @for (s of subjects(); track s.id) {
                      <option [value]="s.id">{{ isAr() ? s.nameAr : s.nameEn }} ({{ s.gradeLevel }})</option>
                    }
                  </select>
                  <app-field-error [c]="grantForm.get('subjectId')" [label]="isAr() ? 'المادة' : 'Subject'"/>
                  <small class="text-secondary d-block mt-1" style="font-size:.72rem">
                    {{ isAr() ? 'ملاحظة: يجب أن توجد مجموعة بنفس صف ومنهج الطالب' : 'Note: a group must exist with the student\\'s grade + curriculum' }}
                  </small>
                </div>
                <div class="mb-3">
                  <label class="form-label">{{ isAr() ? 'المدة' : 'Duration' }}</label>
                  <select formControlName="duration" class="form-select">
                    <option value="Monthly">{{ isAr() ? 'شهر' : '1 Month' }}</option>
                    <option value="Semester">{{ isAr() ? 'فصل دراسي' : 'Semester' }}</option>
                    <option value="Yearly">{{ isAr() ? 'سنة دراسية' : 'Academic Year' }}</option>
                  </select>
                  <app-field-error [c]="grantForm.get('duration')" [label]="isAr() ? 'المدة' : 'Duration'"/>
                </div>
                <div class="mb-3">
                  <label class="form-label">{{ isAr() ? 'السبب' : 'Reason' }}</label>
                  <input formControlName="reason" class="form-control" [placeholder]="isAr() ? 'مثال: منحة تفوق' : 'e.g. Scholarship'">
                  <app-field-error [c]="grantForm.get('reason')" [label]="isAr() ? 'السبب' : 'Reason'"/>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="showGrantModal.set(false)">{{ isAr() ? 'إلغاء' : 'Cancel' }}</button>
                <button type="submit" class="btn btn-success" [disabled]="grantForm.invalid || granting()">
                  @if (granting()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                  {{ isAr() ? 'منح الاشتراك' : 'Grant Subscription' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <app-confirm-modal [open]="toggleModal()"
      [titleAr]="toggleTarget()?.isActive ? 'تعطيل الطالب' : 'تنشيط الطالب'"
      [titleEn]="toggleTarget()?.isActive ? 'Deactivate Student' : 'Activate Student'"
      [messageAr]="'هل تريد ' + (toggleTarget()?.isActive ? 'تعطيل حساب الطالب ' : 'تنشيط حساب الطالب ') + (toggleTarget()?.fullNameAr ?? '') + '؟'"
      [messageEn]="'Do you want to ' + (toggleTarget()?.isActive ? 'deactivate the account of ' : 'activate the account of ') + (toggleTarget()?.fullNameEn ?? '') + '?'"
      [loading]="saving()" (confirm)="doToggle()" (cancelled)="toggleModal.set(false)"/>

    <app-reset-password-modal
      [open]="resetPwdOpen()"
      [userId]="resetPwdTarget()?.id ?? ''"
      [userName]="(isAr() ? resetPwdTarget()?.fullNameAr : resetPwdTarget()?.fullNameEn) ?? ''"
      (closed)="resetPwdOpen.set(false)"/>

    <!-- Parent Edit Modal -->
    @if (showParentModal()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title text-info"><i class="bi bi-people me-2"></i>{{ isAr() ? 'بيانات ولي الأمر' : 'Parent Info' }}</h5>
              <button type="button" class="btn-close" (click)="showParentModal.set(false)"></button>
            </div>
            <form [formGroup]="parentForm" (ngSubmit)="saveParent()">
              <div class="modal-body">
                <div class="alert alert-light border small d-flex align-items-start gap-2" role="alert">
                  <i class="bi bi-info-circle text-info mt-1"></i>
                  <span>{{ isAr() ? 'قد يكون ولي الأمر مرتبطاً بأكثر من طالب — أي تعديل ينطبق على جميع أبنائه.' : 'This parent may be linked to multiple students — changes apply to all their children.' }}</span>
                </div>
                <div class="row g-3">
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'الاسم (عربي)' : 'Arabic Name' }}</label>
                    <input formControlName="fullNameAr" class="form-control">
                    <app-field-error [c]="parentForm.get('fullNameAr')" [label]="isAr() ? 'اسم ولي الأمر بالعربي' : 'Parent Arabic Name'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'الاسم (إنجليزي)' : 'English Name' }}</label>
                    <input formControlName="fullNameEn" class="form-control">
                    <app-field-error [c]="parentForm.get('fullNameEn')" [label]="isAr() ? 'اسم ولي الأمر بالإنجليزي' : 'Parent English Name'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'البريد الإلكتروني' : 'Email' }}</label>
                    <input formControlName="email" type="email" class="form-control">
                    <app-field-error [c]="parentForm.get('email')" [label]="isAr() ? 'بريد ولي الأمر' : 'Parent Email'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'واتساب (مع كود الدولة)' : 'WhatsApp (with country code)' }}</label>
                    <input formControlName="whatsApp" type="tel" class="form-control" dir="ltr" [placeholder]="phonePlaceholder">
                  </div>
                </div>
                <hr class="my-3">
                <button type="button" class="btn btn-sm btn-outline-warning" (click)="openParentReset()" [disabled]="!parentUserId()">
                  <i class="bi bi-key me-1"></i>{{ isAr() ? 'إعادة تعيين كلمة مرور ولي الأمر' : 'Reset Parent Password' }}
                </button>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="showParentModal.set(false)">{{ isAr() ? 'إلغاء' : 'Cancel' }}</button>
                <button type="submit" class="btn btn-primary" [disabled]="parentForm.invalid || savingParent()">
                  @if (savingParent()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                  {{ isAr() ? 'حفظ' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Parent password reset (reuses the shared reset-password endpoint with the parent's user id) -->
    <app-reset-password-modal
      [open]="parentResetOpen()"
      [userId]="parentUserId()"
      [userName]="(isAr() ? parentForm.get('fullNameAr')?.value : parentForm.get('fullNameEn')?.value) ?? ''"
      (closed)="parentResetOpen.set(false)"/>
  `
})
export class StudentsComponent implements OnInit {
  private readonly adminSvc   = inject(AdminService);
  private readonly catalogSvc = inject(CatalogService);
  private readonly toast      = inject(ToastService);
  private readonly fb         = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly students   = signal<StudentUser[]>([]);
  readonly subjects   = signal<Subject[]>([]);
  readonly loading    = signal(true);
  readonly saving     = signal(false);
  readonly granting   = signal(false);
  readonly showForm   = signal(false);
  readonly showGrantModal = signal(false);
  readonly toggleModal = signal(false);
  readonly editing    = signal<StudentUser | null>(null);
  readonly toggleTarget = signal<StudentUser | null>(null);
  readonly grantTarget  = signal<StudentUser | null>(null);
  readonly resetPwdOpen    = signal(false);
  readonly resetPwdTarget  = signal<StudentUser | null>(null);
  readonly page       = signal(1);
  readonly totalPages = signal(1);
  readonly total      = signal(0);
  readonly createdPassword = signal<string | null>(null);
  readonly phonePlaceholder = PHONE_PLACEHOLDER;

  readonly grades = [
    'KG1', 'KG2', 'Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6',
    'Grade7', 'Grade8', 'Grade9', 'Grade10', 'Grade11', 'Grade12'
  ];

  // Validators mirror the backend FluentValidation rules so the user sees
  // the same constraints client-side before submitting.
  form = this.fb.group({
    fullNameAr: ['', [Validators.required, Validators.maxLength(200)]],
    fullNameEn: ['', [Validators.required, Validators.maxLength(200)]],
    email:      ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phoneNumber:['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    curriculum: ['Egyptian', Validators.required],
    gradeLevel: ['Grade1', Validators.required],
    parentFullNameAr: ['', [Validators.required, Validators.maxLength(200)]],
    parentFullNameEn: ['', [Validators.required, Validators.maxLength(200)]],
    parentEmail: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    parentWhatsApp: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]]
  });

  grantForm = this.fb.group({
    subjectId: ['', Validators.required],
    duration:  ['Monthly', Validators.required],
    reason:    ['', [Validators.required, Validators.maxLength(500)]]
  });

  // ── Parent management ──
  readonly showParentModal = signal(false);
  readonly savingParent    = signal(false);
  readonly parentResetOpen = signal(false);
  readonly parentUserId    = signal<string>('');         // the parent's user id (for password reset)
  readonly parentStudentId = signal<string>('');         // the student whose parent we're editing
  parentForm = this.fb.group({
    fullNameAr: ['', [Validators.required, Validators.maxLength(200)]],
    fullNameEn: ['', [Validators.required, Validators.maxLength(200)]],
    email:      ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    whatsApp:   ['', [Validators.pattern(PHONE_PATTERN)]]
  });

  ngOnInit() { 
    this.load(1);
    this.loadSubjects();
  }

  load(p: number) {
    this.loading.set(true); this.page.set(p);
    this.adminSvc.getStudents(p, 20).subscribe(r => {
      if (r.success && r.data) { this.students.set(r.data.items); this.total.set(r.data.totalCount); this.totalPages.set(r.data.totalPages); }
      this.loading.set(false);
    });
  }

  loadSubjects() {
    this.catalogSvc.getSubjects().subscribe(r => {
      if (r.success && r.data) this.subjects.set(r.data);
    });
  }

  openAddForm() {
    this.editing.set(null);
    this.form.reset({ curriculum: 'Egyptian', gradeLevel: 'Grade1' });
    this.form.get('email')?.setValidators([Validators.required, Validators.email]);
    this.form.get('curriculum')?.setValidators(Validators.required);
    this.form.get('gradeLevel')?.setValidators(Validators.required);
    this.form.get('parentFullNameAr')?.setValidators(Validators.required);
    this.form.get('parentFullNameEn')?.setValidators(Validators.required);
    this.form.get('parentEmail')?.setValidators([Validators.required, Validators.email]);
    this.form.get('parentWhatsApp')?.setValidators(Validators.required);
    this.form.updateValueAndValidity();
    this.showForm.set(true);
  }

  openEditForm(s: StudentUser) {
    this.editing.set(s);
    this.form.reset();
    this.form.patchValue({
      fullNameAr: s.fullNameAr,
      fullNameEn: s.fullNameEn,
      phoneNumber: s.phoneNumber || s.phone
    });
    // Remove validators for fields not needed in edit
    this.form.get('email')?.clearValidators();
    this.form.get('curriculum')?.clearValidators();
    this.form.get('gradeLevel')?.clearValidators();
    this.form.get('parentFullNameAr')?.clearValidators();
    this.form.get('parentFullNameEn')?.clearValidators();
    this.form.get('parentEmail')?.clearValidators();
    this.form.get('parentWhatsApp')?.clearValidators();
    this.form.updateValueAndValidity();
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    
    if (this.editing()) {
      const dto = {
        fullNameAr: this.form.value.fullNameAr!,
        fullNameEn: this.form.value.fullNameEn!,
        phoneNumber: normalizePhone(this.form.value.phoneNumber)
      };
      this.adminSvc.updateStudent(this.editing()!.id, dto).subscribe({
        next: r => { 
          this.saving.set(false); 
          if (r.success) { 
            this.toast.success('تم', 'Saved'); 
            this.closeForm(); 
            this.load(this.page()); 
          } 
        },
        error: () => this.saving.set(false)
      });
    } else {
      const payload: any = { ...this.form.value };
      payload.phoneNumber = normalizePhone(payload.phoneNumber);
      payload.parentWhatsApp = normalizePhone(payload.parentWhatsApp);
      this.adminSvc.createStudent(payload).subscribe({
        next: r => { 
          this.saving.set(false); 
          if (r.success) { 
            this.toast.success('تم', 'Saved'); 
            if ((r.data as any)?.tempPassword) {
              this.createdPassword.set((r.data as any).tempPassword);
            }
            this.closeForm(); 
            this.load(this.page()); 
          } 
        },
        error: () => this.saving.set(false)
      });
    }
  }

  openResetPassword(s: StudentUser) { this.resetPwdTarget.set(s); this.resetPwdOpen.set(true); }

  confirmToggle(s: StudentUser) { this.toggleTarget.set(s); this.toggleModal.set(true); }
  doToggle() {
    const target = this.toggleTarget();
    if (!target) return;
    this.saving.set(true);
    
    const obs = target.isActive 
      ? this.adminSvc.deactivateStudent(target.id) 
      : this.adminSvc.activateStudent(target.id);

    obs.subscribe({
      next: r => { this.saving.set(false); this.toggleModal.set(false); if (r.success) { this.toast.success('تم','Done'); this.load(this.page()); } },
      error: () => { this.saving.set(false); this.toggleModal.set(false); }
    });
  }

  openGrantModal(s: StudentUser) {
    this.grantTarget.set(s);
    this.grantForm.reset({ duration: 'Monthly', reason: '' });
    this.showGrantModal.set(true);
  }

  grantSubscription() {
    if (this.grantForm.invalid || !this.grantTarget()) return;
    this.granting.set(true);
    
    const { subjectId, duration, reason } = this.grantForm.value;
    
    this.adminSvc.grantFreeSubscription(this.grantTarget()!.id, subjectId!, duration!, reason!).subscribe({
      next: r => {
        this.granting.set(false);
        if (r.success) {
          this.toast.success('تم منح الاشتراك بنجاح', 'Subscription Granted');
          this.showGrantModal.set(false);
          this.load(this.page()); // reload to update active subs count
        }
      },
      error: () => this.granting.set(false)
    });
  }

  // ── Parent management ──
  openParentModal(s: StudentUser) {
    this.parentStudentId.set(s.id);
    this.parentUserId.set('');
    this.parentForm.reset();
    this.showParentModal.set(true);
    // Fetch the student detail to load the linked parent's info + id.
    this.adminSvc.getStudent(s.id).subscribe(r => {
      if (r.success && r.data) {
        const d = r.data as any;
        this.parentUserId.set(d.parentId ?? '');
        this.parentForm.patchValue({
          fullNameAr: d.parentFullNameAr ?? '',
          fullNameEn: d.parentFullNameEn ?? '',
          email:      d.parentEmail ?? '',
          whatsApp:   d.parentWhatsApp ?? ''
        });
      }
    });
  }

  saveParent() {
    if (this.parentForm.invalid) { this.parentForm.markAllAsTouched(); return; }
    this.savingParent.set(true);
    const v = this.parentForm.value;
    this.adminSvc.updateStudentParent(this.parentStudentId(), {
      fullNameAr: v.fullNameAr!,
      fullNameEn: v.fullNameEn!,
      email:      v.email!,
      whatsApp:   normalizePhone(v.whatsApp) || undefined
    }).subscribe({
      next: r => {
        this.savingParent.set(false);
        if (r.success) {
          this.toast.success('تم تحديث بيانات ولي الأمر', 'Parent updated');
          this.showParentModal.set(false);
          this.load(this.page());
        }
      },
      error: () => this.savingParent.set(false)
    });
  }

  /** Close the parent modal and open the shared reset-password modal targeting the parent's user id. */
  openParentReset() {
    if (!this.parentUserId()) return;
    this.showParentModal.set(false);
    this.parentResetOpen.set(true);
  }

  getGradeName(g: string): string {
    return g?.replace('Grade', 'الصف ')?.replace('KG', 'رياض أطفال ') || g;
  }
}
