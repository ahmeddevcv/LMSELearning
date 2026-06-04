import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { AdminSubject, TeacherUser } from '../../../core/models';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent, ConfirmModalComponent, PaginationComponent],
  template: `
    <div class="page-fade">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'إدارة المواد الدراسية' : 'Subjects Management' }}</h1>
          <p class="section-subtitle">{{ total() }} {{ isAr() ? 'مادة' : 'subjects' }}</p>
        </div>
        <button class="btn btn-primary" (click)="openAdd()">
          <i class="bi bi-plus-lg"></i> {{ isAr() ? 'مادة جديدة' : 'New Subject' }}
        </button>
      </div>

      <!-- Table Card -->
      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0 table-cards" style="min-width:900px">
            <thead>
              <tr>
                <th>{{ isAr() ? 'اسم المادة' : 'Subject' }}</th>
                <th>{{ isAr() ? 'المعلم المسؤول' : 'Teacher' }}</th>
                <th>{{ isAr() ? 'الصف / المنهج' : 'Grade / Curr.' }}</th>
                <th>{{ isAr() ? 'شهري' : 'Monthly' }}</th>
                <th>{{ isAr() ? 'تيرم' : 'Semester' }}</th>
                <th>{{ isAr() ? 'سنوي' : 'Yearly' }}</th>
                <th>{{ isAr() ? 'مجموعات' : 'Groups' }}</th>
                <th>{{ isAr() ? 'الحالة' : 'Status' }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <app-skeleton type="table" [count]="8" [colCount]="9"/>
              } @else {
                @for (s of subjects(); track s.id) {
                  <tr>
                    <td [attr.data-label]="isAr() ? 'اسم المادة' : 'Subject'">
                      <div class="fw-semibold" style="font-size:.875rem">{{ isAr() ? s.nameAr : s.nameEn }}</div>
                      <div class="text-secondary" style="font-size:.75rem">{{ isAr() ? s.nameEn : s.nameAr }}</div>
                    </td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'المعلم' : 'Teacher'">
                      @if (s.teacherNameAr) {
                        <div class="d-flex align-items-center gap-2">
                          <div class="avatar" style="width:26px;height:26px;font-size:.68rem">{{ s.teacherNameAr.charAt(0) }}</div>
                          <span>{{ isAr() ? s.teacherNameAr : s.teacherNameEn }}</span>
                        </div>
                      } @else {
                        <span class="text-secondary fst-italic" style="font-size:.82rem">{{ isAr() ? 'غير معين' : 'Unassigned' }}</span>
                      }
                    </td>
                    <td style="font-size:.82rem" [attr.data-label]="isAr() ? 'الصف / المنهج' : 'Grade / Curr.'">
                      <span class="badge bg-light text-dark border me-1">{{ s.gradeLevel }}</span>
                      <span class="badge bg-light text-dark border">{{ s.curriculum }}</span>
                    </td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'شهري' : 'Monthly'">{{ s.monthlyPrice ? (s.monthlyPrice | number:'1.0-0') + ' ' + s.currency : '—' }}</td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'تيرم' : 'Semester'">{{ s.semesterPrice ? (s.semesterPrice | number:'1.0-0') + ' ' + s.currency : '—' }}</td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'سنوي' : 'Yearly'">{{ s.yearlyPrice ? (s.yearlyPrice | number:'1.0-0') + ' ' + s.currency : '—' }}</td>
                    <td [attr.data-label]="isAr() ? 'مجموعات' : 'Groups'">
                      <span class="badge bg-primary bg-opacity-10 text-primary fw-semibold">
                        <i class="bi bi-collection me-1"></i>{{ s.groupCount }}
                      </span>
                    </td>
                    <td [attr.data-label]="isAr() ? 'الحالة' : 'Status'">
                      <span class="badge" [class]="s.isActive ? 'badge-active' : 'badge-inactive'">
                        {{ isAr() ? (s.isActive ? 'نشطة' : 'موقفة') : (s.isActive ? 'Active' : 'Inactive') }}
                      </span>
                    </td>
                    <td class="cell-actions">
                      <div class="d-flex gap-1 justify-content-end">
                        <button class="btn btn-sm btn-outline-primary" (click)="openEdit(s)" [title]="isAr() ? 'تعديل' : 'Edit'">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(s)" [title]="isAr() ? 'حذف' : 'Delete'">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (!subjects().length && !loading()) {
                  <tr><td colspan="9" class="cell-empty text-center py-5 text-secondary">
                    <i class="bi bi-journal-bookmark d-block fs-1 opacity-25 mb-2"></i>
                    {{ isAr() ? 'لا توجد مواد مضافة' : 'No subjects found' }}
                  </td></tr>
                }
              }
            </tbody>
          </table>
        </div>
        <app-pagination [currentPage]="page()" [totalPages]="totalPages()" [totalCount]="total()" [pageSize]="20" (pageChange)="load($event)"/>
      </div>
    </div>

    <!-- ─── Add / Edit Modal ──────────────────────────────────────────── -->
    @if (showForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi {{ editing() ? 'bi-pencil-square' : 'bi-journal-plus' }} me-2 text-primary"></i>
                {{ editing() ? (isAr() ? 'تعديل المادة' : 'Edit Subject') : (isAr() ? 'مادة جديدة' : 'New Subject') }}
              </h5>
              <button type="button" class="btn-close" (click)="closeForm()"></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="modal-body">
                <!-- Basic Info -->
                <h6 class="text-primary border-bottom pb-2 mb-3">{{ isAr() ? 'بيانات المادة' : 'Subject Info' }}</h6>
                <div class="row g-3">
                  <div class="col-sm-6">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'الاسم بالعربية' : 'Arabic Name' }} <span class="text-danger">*</span></label>
                    <input formControlName="nameAr" class="form-control" placeholder="الرياضيات">
                    @if (form.get('nameAr')?.invalid && form.get('nameAr')?.touched) {
                      <div class="text-danger" style="font-size:.78rem">{{ isAr() ? 'مطلوب' : 'Required' }}</div>
                    }
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'الاسم بالإنجليزية' : 'English Name' }} <span class="text-danger">*</span></label>
                    <input formControlName="nameEn" class="form-control" placeholder="Mathematics">
                    @if (form.get('nameEn')?.invalid && form.get('nameEn')?.touched) {
                      <div class="text-danger" style="font-size:.78rem">{{ isAr() ? 'مطلوب' : 'Required' }}</div>
                    }
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'وصف (عربي)' : 'Description (AR)' }}</label>
                    <textarea formControlName="descriptionAr" class="form-control" rows="2" placeholder="وصف مختصر..."></textarea>
                  </div>
                  <div class="col-12">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'وصف (إنجليزي)' : 'Description (EN)' }}</label>
                    <textarea formControlName="descriptionEn" class="form-control" rows="2" placeholder="Short description..."></textarea>
                  </div>

                  @if (!editing()) {
                    <div class="col-sm-6">
                      <label class="form-label small fw-semibold">{{ isAr() ? 'الصف الدراسي' : 'Grade Level' }} <span class="text-danger">*</span></label>
                      <select formControlName="gradeLevel" class="form-select">
                        @for (g of grades; track g) { <option [value]="g">{{ g }}</option> }
                      </select>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small fw-semibold">{{ isAr() ? 'المنهج' : 'Curriculum' }} <span class="text-danger">*</span></label>
                      <select formControlName="curriculum" class="form-select">
                        <option value="Egyptian">{{ isAr() ? 'المصري' : 'Egyptian' }}</option>
                        <option value="Gulf">{{ isAr() ? 'الخليجي' : 'Gulf' }}</option>
                        <option value="IG">IG</option>
                        <option value="American">American</option>
                      </select>
                    </div>
                  }

                  <!-- Teacher -->
                  <div class="col-sm-6">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'المعلم المسؤول' : 'Assigned Teacher' }}</label>
                    <select formControlName="teacherId" class="form-select">
                      <option value="">{{ isAr() ? '— بدون معلم —' : '— No Teacher —' }}</option>
                      @for (t of teachers(); track t.id) {
                        <option [value]="t.id">{{ isAr() ? t.fullNameAr : t.fullNameEn }}</option>
                      }
                    </select>
                  </div>

                  <!-- Active toggle (edit only) -->
                  @if (editing()) {
                    <div class="col-sm-6 d-flex align-items-center gap-3 pt-3">
                      <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" formControlName="isActive" id="subjectActiveSwitch" role="switch" style="width:2.5em;height:1.3em">
                        <label class="form-check-label fw-semibold" for="subjectActiveSwitch">
                          {{ form.get('isActive')?.value ? (isAr() ? 'نشطة' : 'Active') : (isAr() ? 'موقفة' : 'Inactive') }}
                        </label>
                      </div>
                    </div>
                  }
                </div>

                <!-- Pricing -->
                <h6 class="text-primary border-bottom pb-2 mt-4 mb-3">
                  <i class="bi bi-tag me-1"></i>{{ isAr() ? 'الأسعار' : 'Pricing' }}
                  <small class="text-secondary fw-normal" style="font-size:.75rem"> ({{ isAr() ? 'اتركها فارغة إذا لم تكن متاحة' : 'leave blank if not available' }})</small>
                </h6>
                <div class="row g-3">
                  <div class="col-sm-4">
                    <label class="form-label small">{{ isAr() ? 'شهري (جنيه)' : 'Monthly (EGP)' }}</label>
                    <div class="input-group">
                      <input formControlName="monthlyPrice" type="number" class="form-control" min="0" placeholder="0">
                      <span class="input-group-text" style="font-size:.8rem">EGP</span>
                    </div>
                  </div>
                  <div class="col-sm-4">
                    <label class="form-label small">{{ isAr() ? 'تيرم (جنيه)' : 'Semester (EGP)' }}</label>
                    <div class="input-group">
                      <input formControlName="semesterPrice" type="number" class="form-control" min="0" placeholder="0">
                      <span class="input-group-text" style="font-size:.8rem">EGP</span>
                    </div>
                  </div>
                  <div class="col-sm-4">
                    <label class="form-label small">{{ isAr() ? 'سنوي (جنيه)' : 'Yearly (EGP)' }}</label>
                    <div class="input-group">
                      <input formControlName="yearlyPrice" type="number" class="form-control" min="0" placeholder="0">
                      <span class="input-group-text" style="font-size:.8rem">EGP</span>
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

    <!-- Delete Confirm -->
    <app-confirm-modal
      [open]="deleteModal()"
      [titleAr]="'حذف المادة: ' + (deleteTarget()?.nameAr ?? '')"
      [titleEn]="'Delete subject: ' + (deleteTarget()?.nameEn ?? '')"
      [messageAr]="'هل تريد تعطيل هذه المادة؟ لن تظهر للطلاب بعد الآن.'"
      [messageEn]="'Deactivate this subject? It will no longer be visible to students.'"
      [confirmLabelAr]="'نعم، تعطيل'"
      [confirmLabelEn]="'Yes, deactivate'"
      [loading]="saving()"
      (confirm)="doDelete()"
      (cancelled)="deleteModal.set(false)"/>
  `
})
export class SubjectsComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast    = inject(ToastService);
  private readonly fb       = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly subjects     = signal<AdminSubject[]>([]);
  readonly teachers     = signal<TeacherUser[]>([]);
  readonly loading      = signal(true);
  readonly saving       = signal(false);
  readonly showForm     = signal(false);
  readonly deleteModal  = signal(false);
  readonly editing      = signal<AdminSubject | null>(null);
  readonly deleteTarget = signal<AdminSubject | null>(null);
  readonly page         = signal(1);
  readonly totalPages   = signal(1);
  readonly total        = signal(0);

  readonly grades = [
    'KG1','KG2','Grade1','Grade2','Grade3','Grade4','Grade5','Grade6',
    'Grade7','Grade8','Grade9','Grade10','Grade11','Grade12'
  ];

  form = this.fb.group({
    nameAr:         ['', Validators.required],
    nameEn:         ['', Validators.required],
    descriptionAr:  [''],
    descriptionEn:  [''],
    gradeLevel:     ['Grade1'],
    curriculum:     ['Egyptian'],
    teacherId:      [''],
    isActive:       [true],
    monthlyPrice:   [null as number | null],
    semesterPrice:  [null as number | null],
    yearlyPrice:    [null as number | null],
  });

  ngOnInit() {
    this.load(1);
    this.loadTeachers();
  }

  load(p: number) {
    this.loading.set(true); this.page.set(p);
    this.adminSvc.getAdminSubjects(p, 20).subscribe(r => {
      if (r.success && r.data) {
        this.subjects.set(r.data.items);
        this.total.set(r.data.totalCount);
        this.totalPages.set(r.data.totalPages);
      }
      this.loading.set(false);
    });
  }

  loadTeachers() {
    this.adminSvc.getTeachers(1, 200).subscribe(r => {
      if (r.success && r.data) this.teachers.set(r.data.items);
    });
  }

  openAdd() {
    this.editing.set(null);
    this.form.reset({ gradeLevel: 'Grade1', curriculum: 'Egyptian', isActive: true });
    this.form.get('gradeLevel')?.setValidators(Validators.required);
    this.form.get('curriculum')?.setValidators(Validators.required);
    this.form.updateValueAndValidity();
    this.showForm.set(true);
  }

  openEdit(s: AdminSubject) {
    this.editing.set(s);
    this.form.reset({
      nameAr: s.nameAr, nameEn: s.nameEn,
      descriptionAr: s.descriptionAr || '',
      descriptionEn: s.descriptionEn || '',
      teacherId: s.teacherId || '',
      isActive: s.isActive,
      monthlyPrice: s.monthlyPrice ?? null,
      semesterPrice: s.semesterPrice ?? null,
      yearlyPrice: s.yearlyPrice ?? null,
    });
    this.form.get('gradeLevel')?.clearValidators();
    this.form.get('curriculum')?.clearValidators();
    this.form.updateValueAndValidity();
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;

    if (this.editing()) {
      this.adminSvc.updateSubject(this.editing()!.id, {
        nameAr: v.nameAr!, nameEn: v.nameEn!,
        descriptionAr: v.descriptionAr || undefined,
        descriptionEn: v.descriptionEn || undefined,
        isActive: v.isActive ?? true,
        teacherId: v.teacherId || undefined,
        monthlyPrice: v.monthlyPrice || undefined,
        semesterPrice: v.semesterPrice || undefined,
        yearlyPrice: v.yearlyPrice || undefined,
        currency: 'EGP'
      }).subscribe({
        next: r => { this.saving.set(false); if (r.success) { this.toast.success('تم التعديل', 'Updated'); this.closeForm(); this.load(this.page()); } },
        error: () => this.saving.set(false)
      });
    } else {
      this.adminSvc.createSubject({
        nameAr: v.nameAr!, nameEn: v.nameEn!,
        descriptionAr: v.descriptionAr || undefined,
        descriptionEn: v.descriptionEn || undefined,
        gradeLevel: v.gradeLevel!, curriculum: v.curriculum!,
        teacherId: v.teacherId || undefined,
        monthlyPrice: v.monthlyPrice || undefined,
        semesterPrice: v.semesterPrice || undefined,
        yearlyPrice: v.yearlyPrice || undefined,
        currency: 'EGP'
      }).subscribe({
        next: r => { this.saving.set(false); if (r.success) { this.toast.success('تم إنشاء المادة', 'Subject Created'); this.closeForm(); this.load(this.page()); } },
        error: () => this.saving.set(false)
      });
    }
  }

  confirmDelete(s: AdminSubject) { this.deleteTarget.set(s); this.deleteModal.set(true); }
  doDelete() {
    const s = this.deleteTarget();
    if (!s) return;
    this.saving.set(true);
    this.adminSvc.deleteSubject(s.id).subscribe({
      next: r => { this.saving.set(false); this.deleteModal.set(false); if (r.success) { this.toast.success('تم التعطيل', 'Deactivated'); this.load(this.page()); } },
      error: () => { this.saving.set(false); this.deleteModal.set(false); }
    });
  }
}
