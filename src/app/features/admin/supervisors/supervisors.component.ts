import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SupervisorUser, SupervisorPermissionType } from '../../../core/models';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';
import { FieldErrorComponent } from '../../../shared/components/field-error/field-error.component';
import { PHONE_PATTERN, PHONE_PLACEHOLDER, normalizePhone } from '../../../core/validators/phone';

// Keys must match SupervisorPermissionType in models/index.ts (= backend enum names)
const PERMISSIONS: { key: SupervisorPermissionType; ar: string; en: string }[] = [
  { key: 'ViewStudents',               ar: 'عرض الطلاب',                     en: 'View Students'                },
  { key: 'ViewStudentReports',         ar: 'عرض تقارير الطلاب',              en: 'View Student Reports'         },
  { key: 'ViewAttendance',             ar: 'عرض الحضور',                     en: 'View Attendance'              },
  { key: 'ViewTeachers',               ar: 'عرض المعلمين',                   en: 'View Teachers'                },
  { key: 'ViewGroups',                 ar: 'عرض المجموعات',                  en: 'View Groups'                  },
  { key: 'ManageContent',              ar: 'إدارة المحتوى',                  en: 'Manage Content'               },
  { key: 'ViewPayments',               ar: 'عرض المدفوعات',                  en: 'View Payments'                },
  { key: 'ReplyContactMessages',       ar: 'الرد على رسائل التواصل',         en: 'Reply Contact Messages'       },
  { key: 'AddRemoveStudentsFromGroups',ar: 'إضافة / إزالة طلاب من المجموعات', en: 'Add/Remove Students from Groups' },
];

@Component({
  selector: 'app-supervisors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmModalComponent, ResetPasswordModalComponent, FieldErrorComponent],
  template: `
    <div class="page-fade">
      <div class="section-header d-flex justify-content-between align-items-center">
        <div>
          <h1 class="section-title">{{ isAr() ? 'المشرفون' : 'Supervisors' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'إدارة المشرفين والصلاحيات' : 'Manage supervisors and permissions' }}</p>
        </div>
        <button class="btn btn-primary d-flex align-items-center gap-2" (click)="openForm()">
          <i class="bi bi-plus-lg"></i>
          {{ isAr() ? 'إضافة مشرف' : 'Add Supervisor' }}
        </button>
      </div>

      <div class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 table-cards">
            <thead class="table-light">
              <tr>
                <th>{{ isAr() ? 'الاسم' : 'Name' }}</th>
                <th>{{ isAr() ? 'البريد' : 'Email' }}</th>
                <th>{{ isAr() ? 'الهاتف' : 'Phone' }}</th>
                <th>{{ isAr() ? 'الحالة' : 'Status' }}</th>
                <th>{{ isAr() ? 'الصلاحيات' : 'Permissions' }}</th>
                <th style="width: 130px">{{ isAr() ? 'إجراءات' : 'Actions' }}</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr><td colspan="6" class="cell-empty text-center py-5"><span class="spinner-border text-primary"></span></td></tr>
              } @else {
                @for (s of supervisors(); track s.id) {
                  <tr>
                    <td [attr.data-label]="isAr() ? 'الاسم' : 'Name'">
                      <div class="d-flex align-items-center gap-3">
                        <div class="avatar-circle bg-primary bg-opacity-10 text-primary">
                          {{ s.fullNameAr.charAt(0) }}
                        </div>
                        <div>
                          <div class="fw-bold">{{ isAr() ? s.fullNameAr : s.fullNameEn }}</div>
                        </div>
                      </div>
                    </td>
                    <td [attr.data-label]="isAr() ? 'البريد' : 'Email'">{{ s.email }}</td>
                    <td dir="ltr" class="text-end" [attr.data-label]="isAr() ? 'الهاتف' : 'Phone'">{{ s.phone }}</td>
                    <td [attr.data-label]="isAr() ? 'الحالة' : 'Status'">
                      @if (s.isActive) {
                        <span class="badge bg-success bg-opacity-10 text-success px-2 py-1">{{ isAr() ? 'نشط' : 'Active' }}</span>
                      } @else {
                        <span class="badge bg-danger bg-opacity-10 text-danger px-2 py-1">{{ isAr() ? 'غير نشط' : 'Inactive' }}</span>
                      }
                    </td>
                    <td [attr.data-label]="isAr() ? 'الصلاحيات' : 'Permissions'">
                      <button class="btn btn-sm btn-light" (click)="openPermForm(s)">
                        {{ s.permissions?.length || 0 }} {{ isAr() ? 'صلاحيات' : 'Permissions' }}
                      </button>
                    </td>
                    <td class="cell-actions">
                      <div class="d-flex gap-1">
                        <!-- Edit Info -->
                        <button class="btn btn-sm btn-outline-primary" (click)="openEditForm(s)" [title]="isAr() ? 'تعديل البيانات' : 'Edit Info'">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <!-- Reset Password -->
                        <button class="btn btn-sm btn-outline-warning" (click)="openResetPassword(s)" [title]="isAr() ? 'إعادة تعيين كلمة المرور' : 'Reset Password'">
                          <i class="bi bi-key"></i>
                        </button>
                        <!-- Deactivate -->
                        @if (s.isActive) {
                          <button class="btn btn-sm btn-outline-danger" (click)="confirmToggle(s)" [title]="isAr() ? 'تعطيل' : 'Deactivate'">
                            <i class="bi bi-x-circle"></i>
                          </button>
                        } @else {
                          <button class="btn btn-sm btn-outline-secondary" disabled [title]="isAr() ? 'معطّل' : 'Deactivated'">
                            <i class="bi bi-dash-circle"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
                @if (!supervisors().length) {
                  <tr><td colspan="6" class="cell-empty text-center py-5 text-secondary">{{ isAr() ? 'لا يوجد مشرفون' : 'No supervisors found' }}</td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══════════════════ Create Supervisor Modal ══════════════════ -->
    @if (showForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isAr() ? 'إضافة مشرف' : 'Add Supervisor' }}</h5>
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
                    <input formControlName="email" type="email" class="form-control" placeholder="supervisor@lms.com" autocomplete="off">
                    <app-field-error [c]="form.get('email')" [label]="isAr() ? 'البريد الإلكتروني' : 'Email'"/>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small">{{ isAr() ? 'الهاتف (مع كود الدولة)' : 'Phone (with country code)' }}</label>
                    <input formControlName="phoneNumber" type="tel" class="form-control" dir="ltr" [placeholder]="phonePlaceholder" autocomplete="new-phone">
                    <app-field-error [c]="form.get('phoneNumber')" [label]="isAr() ? 'الهاتف' : 'Phone'"/>
                    <small class="text-secondary d-block mt-1" style="font-size:.72rem">{{ isAr() ? 'مثال: +201129841926 — بكود الدولة وبدون صفر' : 'e.g. +201129841926 — include country code, no leading 0' }}</small>
                  </div>
                  <div class="col-12">
                    <label class="form-label small">{{ isAr() ? 'كلمة المرور' : 'Password' }}</label>
                    <div class="input-group">
                      <input formControlName="password" [type]="showPassword() ? 'text' : 'password'" class="form-control" placeholder="••••••••" autocomplete="new-password">
                      <button type="button" class="btn btn-outline-secondary" (click)="showPassword.set(!showPassword())" tabindex="-1">
                        <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
                      </button>
                    </div>
                    <app-field-error [c]="form.get('password')" [label]="isAr() ? 'كلمة المرور' : 'Password'"/>
                  </div>
                  <div class="col-12 mt-2">
                    <label class="form-label fw-bold mb-3">{{ isAr() ? 'الصلاحيات' : 'Permissions' }}</label>
                    <div class="row g-2">
                      @for (p of allPermissions; track p.key) {
                        <div class="col-sm-6">
                          <div class="form-check form-switch">
                            <input class="form-check-input" type="checkbox" [id]="'p_'+p.key" (change)="togglePermission(p.key, $event)">
                            <label class="form-check-label" [for]="'p_'+p.key">{{ isAr() ? p.ar : p.en }}</label>
                          </div>
                        </div>
                      }
                    </div>
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

    <!-- ══════════════════ Edit Supervisor Info Modal ══════════════════ -->
    @if (showEditForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ isAr() ? 'تعديل بيانات المشرف' : 'Edit Supervisor Info' }}
                — {{ isAr() ? editingTarget()?.fullNameAr : editingTarget()?.fullNameEn }}
              </h5>
              <button type="button" class="btn-close" (click)="closeEditForm()"></button>
            </div>
            <form [formGroup]="editForm" (ngSubmit)="saveEdit()">
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-sm-6"><label class="form-label small">{{ isAr() ? 'الاسم (عربي)' : 'Arabic Name' }}</label><input formControlName="fullNameAr" class="form-control"></div>
                  <div class="col-sm-6"><label class="form-label small">{{ isAr() ? 'الاسم (إنجليزي)' : 'English Name' }}</label><input formControlName="fullNameEn" class="form-control"></div>
                  <div class="col-sm-6"><label class="form-label small">{{ isAr() ? 'البريد الإلكتروني' : 'Email' }}</label><input formControlName="email" type="email" class="form-control"></div>
                  <div class="col-sm-6"><label class="form-label small">{{ isAr() ? 'رقم الهاتف (مع كود الدولة)' : 'Phone (with country code)' }}</label><input formControlName="phoneNumber" type="tel" class="form-control" dir="ltr" [placeholder]="phonePlaceholder"></div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="closeEditForm()">{{ isAr() ? 'إلغاء' : 'Cancel' }}</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                  {{ isAr() ? 'حفظ التعديلات' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════ Edit Permissions Modal ══════════════════ -->
    @if (showPermForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isAr() ? 'تعديل الصلاحيات' : 'Edit Permissions' }} - {{ isAr() ? editingTarget()?.fullNameAr : editingTarget()?.fullNameEn }}</h5>
              <button type="button" class="btn-close" (click)="closePermForm()"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                @for (p of allPermissions; track p.key) {
                  <div class="col-sm-6">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" [id]="'ep_'+p.key" [checked]="hasPerm(p.key)" (change)="toggleEditPerm(p.key, $event)">
                      <label class="form-check-label" [for]="'ep_'+p.key">{{ isAr() ? p.ar : p.en }}</label>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="closePermForm()">{{ isAr() ? 'إلغاء' : 'Cancel' }}</button>
              <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="savePermissions()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                {{ isAr() ? 'حفظ' : 'Save' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════ Success — Show Temp Password ══════════════════ -->
    @if (createdPassword()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg">
            <div class="modal-body text-center p-5">
              <div class="mb-4 text-success"><i class="bi bi-check-circle-fill" style="font-size: 4rem;"></i></div>
              <h4 class="mb-3 fw-bold">{{ isAr() ? 'تم إضافة المشرف بنجاح' : 'Supervisor Added Successfully' }}</h4>
              <p class="text-secondary mb-4">{{ isAr() ? 'كلمة المرور المؤقتة للمشرف الجديد هي:' : 'The temporary password for the new supervisor is:' }}</p>
              <div class="bg-light p-3 rounded-3 d-flex align-items-center justify-content-center gap-3 mb-4 border">
                <code class="fs-4 text-dark fw-bold" style="letter-spacing: 2px;">{{ createdPassword() }}</code>
              </div>
              <p class="small text-danger mb-4"><i class="bi bi-exclamation-triangle me-1"></i>{{ isAr() ? 'يرجى نسخ كلمة المرور الآن، لن يتم عرضها مرة أخرى.' : 'Please copy the password now, it will not be shown again.' }}</p>
              <button class="btn btn-primary px-5 py-2 fw-semibold" (click)="createdPassword.set(null)">{{ isAr() ? 'حسناً، قمت بنسخها' : 'Got it, copied' }}</button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════════ Confirm Deactivate Modal ══════════════════ -->
    <app-confirm-modal [open]="toggleModal()"
      [titleAr]="'تعطيل المشرف'"
      [titleEn]="'Deactivate Supervisor'"
      [messageAr]="'هل تريد تعطيل ' + (toggleTarget()?.fullNameAr ?? '') + '؟'"
      [messageEn]="'Do you want to deactivate ' + (toggleTarget()?.fullNameEn ?? '') + '?'"
      [loading]="saving()" (confirm)="doToggle()" (cancelled)="toggleModal.set(false)"/>

    <app-reset-password-modal
      [open]="resetPwdOpen()"
      [userId]="resetPwdTarget()?.id ?? ''"
      [userName]="(isAr() ? resetPwdTarget()?.fullNameAr : resetPwdTarget()?.fullNameEn) ?? ''"
      (closed)="resetPwdOpen.set(false)"/>
  `
})
export class SupervisorsComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast    = inject(ToastService);
  private readonly fb       = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly supervisors   = signal<SupervisorUser[]>([]);
  readonly loading       = signal(true);
  readonly saving        = signal(false);
  readonly showForm      = signal(false);
  readonly showEditForm  = signal(false);
  readonly showPermForm  = signal(false);
  readonly toggleModal   = signal(false);

  readonly toggleTarget  = signal<SupervisorUser | null>(null);
  readonly editingTarget = signal<SupervisorUser | null>(null);
  readonly resetPwdOpen    = signal(false);
  readonly resetPwdTarget  = signal<SupervisorUser | null>(null);

  readonly showPassword    = signal(false);
  readonly createdPassword = signal<string | null>(null);
  readonly allPermissions  = PERMISSIONS;
  readonly phonePlaceholder = PHONE_PLACEHOLDER;

  readonly selectedPerms = signal<SupervisorPermissionType[]>([]);
  readonly editPerms     = signal<SupervisorPermissionType[]>([]);

  /** Form for creating a new supervisor — mirrors backend CreateSupervisorValidator */
  form = this.fb.group({
    fullNameAr:  ['', [Validators.required, Validators.maxLength(200)]],
    fullNameEn:  ['', [Validators.required, Validators.maxLength(200)]],
    email:       ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password:    ['', [Validators.required, Validators.minLength(8)]]
  });

  /** Form for editing an existing supervisor's basic info */
  editForm = this.fb.group({
    fullNameAr:  ['', [Validators.required, Validators.maxLength(200)]],
    fullNameEn:  ['', [Validators.required, Validators.maxLength(200)]],
    email:       ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phoneNumber: ['', [Validators.pattern(PHONE_PATTERN)]]
  });

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminSvc.getSupervisors().subscribe({
      next: r => {
        if (r.success && r.data) { this.supervisors.set(r.data); }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  openForm() {
    this.form.reset();
    this.selectedPerms.set([]);
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  togglePermission(key: SupervisorPermissionType, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const current = [...this.selectedPerms()];
    if (isChecked) { current.push(key); }
    else { const idx = current.indexOf(key); if (idx > -1) current.splice(idx, 1); }
    this.selectedPerms.set(current);
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const data = { ...this.form.value, phoneNumber: normalizePhone(this.form.value.phoneNumber), permissions: this.selectedPerms() };

    this.adminSvc.createSupervisor(data as any).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.toast.success('تم', 'Saved');
          if ((r.data as any)?.tempPassword) {
            this.createdPassword.set((r.data as any).tempPassword);
          }
          this.closeForm();
          this.load();
        }
      },
      error: () => this.saving.set(false)
    });
  }

  // ── Edit Info ───────────────────────────────────────────────────────────────

  openEditForm(s: SupervisorUser) {
    this.editingTarget.set(s);
    this.editForm.patchValue({
      fullNameAr:  s.fullNameAr,
      fullNameEn:  s.fullNameEn,
      email:       s.email,
      phoneNumber: s.phone ?? ''
    });
    this.showEditForm.set(true);
  }

  closeEditForm() {
    this.showEditForm.set(false);
    this.editingTarget.set(null);
  }

  saveEdit() {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const target = this.editingTarget();
    if (!target) return;

    this.saving.set(true);
    const dto = { ...this.editForm.value, phoneNumber: normalizePhone(this.editForm.value.phoneNumber) };
    this.adminSvc.updateSupervisor(target.id, dto as Partial<SupervisorUser>).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.toast.success('تم التعديل', 'Updated');
          this.closeEditForm();
          this.load();
        }
      },
      error: () => this.saving.set(false)
    });
  }

  // ── Permissions ─────────────────────────────────────────────────────────────

  openPermForm(s: SupervisorUser) {
    this.editingTarget.set(s);
    this.editPerms.set(s.permissions ? [...s.permissions] : []);
    this.showPermForm.set(true);
  }

  closePermForm() {
    this.showPermForm.set(false);
    this.editingTarget.set(null);
  }

  hasPerm(key: SupervisorPermissionType): boolean {
    return this.editPerms().includes(key);
  }

  toggleEditPerm(key: SupervisorPermissionType, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const current = [...this.editPerms()];
    if (isChecked) { if (!current.includes(key)) current.push(key); }
    else { const idx = current.indexOf(key); if (idx > -1) current.splice(idx, 1); }
    this.editPerms.set(current);
  }

  savePermissions() {
    const target = this.editingTarget();
    if (!target) return;

    this.saving.set(true);
    this.adminSvc.updateSupervisorPermissions(target.id, this.editPerms()).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.toast.success('تم', 'Updated');
          this.closePermForm();
          this.load();
        }
      },
      error: () => this.saving.set(false)
    });
  }

  // ── Deactivate ──────────────────────────────────────────────────────────────

  openResetPassword(s: SupervisorUser) { this.resetPwdTarget.set(s); this.resetPwdOpen.set(true); }

  confirmToggle(s: SupervisorUser) { this.toggleTarget.set(s); this.toggleModal.set(true); }

  doToggle() {
    const target = this.toggleTarget();
    if (!target) return;
    this.saving.set(true);

    this.adminSvc.deactivateSupervisor(target.id).subscribe({
      next: r => {
        this.saving.set(false);
        this.toggleModal.set(false);
        if (r.success) {
          this.toast.success('تم', 'Done');
          this.load();
        }
      },
      error: () => { this.saving.set(false); this.toggleModal.set(false); }
    });
  }
}
