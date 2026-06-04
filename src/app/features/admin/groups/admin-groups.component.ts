import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService, CatalogService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { Group, TeacherUser, Subject } from '../../../core/models';

@Component({
  selector: 'app-admin-groups',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent, ConfirmModalComponent, PaginationComponent],
  template: `
    <div class="page-fade">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'إدارة المجموعات' : 'Groups Management' }}</h1>
          <p class="section-subtitle">{{ total() }} {{ isAr() ? 'مجموعة' : 'groups' }}</p>
        </div>
        <button class="btn btn-primary" (click)="openAdd()">
          <i class="bi bi-plus-lg"></i> {{ isAr() ? 'مجموعة جديدة' : 'New Group' }}
        </button>
      </div>

      <!-- Copied invite toast -->
      @if (copiedMsg()) {
        <div class="alert alert-success d-flex align-items-center gap-2 py-2 mb-3" style="border-radius:10px">
          <i class="bi bi-check-circle-fill"></i>
          <span>{{ isAr() ? 'تم نسخ رابط الدعوة!' : 'Invite link copied!' }}</span>
        </div>
      }

      <!-- Table Card -->
      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0 table-cards" style="min-width:860px">
            <thead>
              <tr>
                <th>{{ isAr() ? 'الاسم' : 'Name' }}</th>
                <th>{{ isAr() ? 'المعلم' : 'Teacher' }}</th>
                <th>{{ isAr() ? 'المادة' : 'Subject' }}</th>
                <th>{{ isAr() ? 'الصف / المنهج' : 'Grade / Curr.' }}</th>
                <th>{{ isAr() ? 'الطلاب' : 'Members' }}</th>
                <th>{{ isAr() ? 'الحالة' : 'Status' }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <app-skeleton type="table" [count]="8" [colCount]="7"/>
              } @else {
                @for (g of groups(); track g.id) {
                  <tr>
                    <td [attr.data-label]="isAr() ? 'الاسم' : 'Name'">
                      <div class="fw-medium" style="font-size:.875rem">{{ isAr() ? g.nameAr : g.nameEn }}</div>
                      <div class="text-secondary" style="font-size:.75rem">{{ isAr() ? g.nameEn : g.nameAr }}</div>
                    </td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'المعلم' : 'Teacher'">
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar" style="width:28px;height:28px;font-size:.7rem">{{ (isAr() ? g.teacherNameAr : g.teacherNameEn)?.charAt(0) }}</div>
                        <span>{{ isAr() ? g.teacherNameAr : g.teacherNameEn }}</span>
                      </div>
                    </td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'المادة' : 'Subject'">{{ isAr() ? g.subjectNameAr : g.subjectNameEn }}</td>
                    <td style="font-size:.82rem" [attr.data-label]="isAr() ? 'الصف / المنهج' : 'Grade / Curr.'">
                      <span class="badge bg-light text-dark border">{{ g.gradeLevel }}</span>
                      <span class="badge bg-light text-dark border ms-1">{{ g.curriculum }}</span>
                    </td>
                    <td [attr.data-label]="isAr() ? 'الطلاب' : 'Members'">
                      <span class="badge bg-primary bg-opacity-10 text-primary fw-semibold">
                        <i class="bi bi-people me-1"></i>{{ g.memberCount }}
                      </span>
                    </td>
                    <td [attr.data-label]="isAr() ? 'الحالة' : 'Status'">
                      <span class="badge" [class]="g.isActive ? 'badge-active' : 'badge-inactive'">
                        {{ isAr() ? (g.isActive ? 'نشطة' : 'موقفة') : (g.isActive ? 'Active' : 'Inactive') }}
                      </span>
                    </td>
                    <td class="cell-actions">
                      <div class="d-flex gap-1 justify-content-end flex-wrap">
                        <button class="btn btn-sm btn-outline-secondary" (click)="copyInvite(g)"
                          [title]="isAr() ? 'نسخ رابط الدعوة' : 'Copy invite link'">
                          <i class="bi bi-link-45deg"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" (click)="regenerate(g)"
                          [title]="isAr() ? 'تجديد رابط الدعوة' : 'Regenerate invite'">
                          <i class="bi bi-arrow-repeat"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" (click)="openEdit(g)"
                          [title]="isAr() ? 'تعديل' : 'Edit'">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" (click)="confirmDelete(g)"
                          [title]="isAr() ? 'حذف' : 'Delete'">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
                @if (!groups().length && !loading()) {
                  <tr><td colspan="7" class="cell-empty text-center py-5 text-secondary">
                    <i class="bi bi-collection d-block fs-1 opacity-25 mb-2"></i>
                    {{ isAr() ? 'لا توجد مجموعات' : 'No groups found' }}
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
                <i class="bi {{ editing() ? 'bi-pencil-square' : 'bi-plus-circle' }} me-2 text-primary"></i>
                {{ editing() ? (isAr() ? 'تعديل المجموعة' : 'Edit Group') : (isAr() ? 'مجموعة جديدة' : 'New Group') }}
              </h5>
              <button type="button" class="btn-close" (click)="closeForm()"></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="modal-body">
                <div class="row g-3">
                  <!-- Names -->
                  <div class="col-sm-6">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'الاسم بالعربية' : 'Arabic Name' }} <span class="text-danger">*</span></label>
                    <input formControlName="nameAr" class="form-control" placeholder="مجموعة الرياضيات أ">
                    @if (form.get('nameAr')?.invalid && form.get('nameAr')?.touched) {
                      <div class="text-danger" style="font-size:.78rem">{{ isAr() ? 'مطلوب' : 'Required' }}</div>
                    }
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'الاسم بالإنجليزية' : 'English Name' }} <span class="text-danger">*</span></label>
                    <input formControlName="nameEn" class="form-control" placeholder="Math Group A">
                    @if (form.get('nameEn')?.invalid && form.get('nameEn')?.touched) {
                      <div class="text-danger" style="font-size:.78rem">{{ isAr() ? 'مطلوب' : 'Required' }}</div>
                    }
                  </div>

                  <!-- Teacher -->
                  <div class="col-sm-6">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'المعلم' : 'Teacher' }} <span class="text-danger">*</span></label>
                    <select formControlName="teacherId" class="form-select">
                      <option value="" disabled>{{ isAr() ? 'اختر معلماً...' : 'Select teacher...' }}</option>
                      @for (t of teachers(); track t.id) {
                        <option [value]="t.id">{{ isAr() ? t.fullNameAr : t.fullNameEn }}</option>
                      }
                    </select>
                    @if (form.get('teacherId')?.invalid && form.get('teacherId')?.touched) {
                      <div class="text-danger" style="font-size:.78rem">{{ isAr() ? 'مطلوب' : 'Required' }}</div>
                    }
                  </div>

                  <!-- Subject (add only) -->
                  @if (!editing()) {
                    <div class="col-sm-6">
                      <label class="form-label small fw-semibold">{{ isAr() ? 'المادة' : 'Subject' }} <span class="text-danger">*</span></label>
                      <select formControlName="subjectId" class="form-select">
                        <option value="" disabled>{{ isAr() ? 'اختر مادة...' : 'Select subject...' }}</option>
                        @for (s of subjects(); track s.id) {
                          <option [value]="s.id">{{ isAr() ? s.nameAr : s.nameEn }} ({{ s.gradeLevel }})</option>
                        }
                      </select>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small fw-semibold">{{ isAr() ? 'المنهج' : 'Curriculum' }}</label>
                      <select formControlName="curriculum" class="form-select">
                        <option value="Egyptian">{{ isAr() ? 'المصري' : 'Egyptian' }}</option>
                        <option value="Gulf">{{ isAr() ? 'الخليجي' : 'Gulf' }}</option>
                        <option value="IG">IG</option>
                        <option value="American">American</option>
                      </select>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small fw-semibold">{{ isAr() ? 'الصف الدراسي' : 'Grade Level' }}</label>
                      <select formControlName="gradeLevel" class="form-select">
                        @for (g of grades; track g) {
                          <option [value]="g">{{ g }}</option>
                        }
                      </select>
                    </div>
                  }

                  <!-- Google Meet Link -->
                  <div class="col-12">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'رابط Google Meet' : 'Google Meet Link' }}</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-camera-video text-success"></i></span>
                      <input formControlName="googleMeetLink" class="form-control" placeholder="https://meet.google.com/xxx-xxxx-xxx">
                    </div>
                  </div>

                  <!-- Max Students -->
                  <div class="col-sm-6">
                    <label class="form-label small fw-semibold">{{ isAr() ? 'الحد الأقصى للطلاب' : 'Max Students' }}</label>
                    <input formControlName="maxStudents" type="number" class="form-control" min="1" placeholder="30">
                  </div>

                  <!-- IsActive (edit only) -->
                  @if (editing()) {
                    <div class="col-sm-6 d-flex align-items-center gap-3 pt-3">
                      <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" formControlName="isActive" id="isActiveSwitch" role="switch" style="width:2.5em;height:1.3em">
                        <label class="form-check-label fw-semibold" for="isActiveSwitch">
                          {{ form.get('isActive')?.value ? (isAr() ? 'نشطة' : 'Active') : (isAr() ? 'موقفة' : 'Inactive') }}
                        </label>
                      </div>
                    </div>
                  }
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

    <!-- ─── Delete Confirm ─────────────────────────────────────────────── -->
    <app-confirm-modal
      [open]="deleteModal()"
      [titleAr]="'حذف المجموعة: ' + (deleteTarget()?.nameAr ?? '')"
      [titleEn]="'Delete group: ' + (deleteTarget()?.nameEn ?? '')"
      [messageAr]="'هل تريد حذف هذه المجموعة؟ لن يمكن التراجع.'"
      [messageEn]="'Delete this group? This cannot be undone.'"
      [confirmLabelAr]="'نعم، احذف'"
      [confirmLabelEn]="'Yes, delete'"
      [loading]="saving()"
      (confirm)="doDelete()"
      (cancelled)="deleteModal.set(false)"/>
  `
})
export class AdminGroupsComponent implements OnInit {
  private readonly adminSvc   = inject(AdminService);
  private readonly catalogSvc = inject(CatalogService);
  private readonly toast      = inject(ToastService);
  private readonly fb         = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  // State
  readonly groups      = signal<Group[]>([]);
  readonly teachers    = signal<TeacherUser[]>([]);
  readonly subjects    = signal<Subject[]>([]);
  readonly loading     = signal(true);
  readonly saving      = signal(false);
  readonly showForm    = signal(false);
  readonly deleteModal = signal(false);
  readonly editing     = signal<Group | null>(null);
  readonly deleteTarget = signal<Group | null>(null);
  readonly page        = signal(1);
  readonly totalPages  = signal(1);
  readonly total       = signal(0);
  readonly copiedMsg   = signal(false);

  readonly grades = [
    'KG1', 'KG2', 'Grade1', 'Grade2', 'Grade3', 'Grade4', 'Grade5', 'Grade6',
    'Grade7', 'Grade8', 'Grade9', 'Grade10', 'Grade11', 'Grade12'
  ];

  form = this.fb.group({
    nameAr:        ['', Validators.required],
    nameEn:        ['', Validators.required],
    teacherId:     ['', Validators.required],
    subjectId:     [''],
    curriculum:    ['Egyptian'],
    gradeLevel:    ['Grade1'],
    googleMeetLink:[''],
    maxStudents:   [null as number | null],
    isActive:      [true]
  });

  ngOnInit() {
    this.load(1);
    this.loadDropdowns();
  }

  load(p: number) {
    this.loading.set(true);
    this.page.set(p);
    this.adminSvc.getAllGroups(p, 20).subscribe(r => {
      if (r.success && r.data) {
        this.groups.set(r.data.items);
        this.total.set(r.data.totalCount);
        this.totalPages.set(r.data.totalPages);
      }
      this.loading.set(false);
    });
  }

  loadDropdowns() {
    // Load all teachers (get first 200)
    this.adminSvc.getTeachers(1, 200).subscribe(r => {
      if (r.success && r.data) this.teachers.set(r.data.items);
    });
    this.catalogSvc.getSubjects().subscribe(r => {
      if (r.success && r.data) this.subjects.set(r.data);
    });
  }

  openAdd() {
    this.editing.set(null);
    this.form.reset({ curriculum: 'Egyptian', gradeLevel: 'Grade1', isActive: true });
    this.form.get('subjectId')?.setValidators(Validators.required);
    this.form.get('subjectId')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  openEdit(g: Group) {
    this.editing.set(g);
    this.form.reset({
      nameAr: g.nameAr,
      nameEn: g.nameEn,
      googleMeetLink: g.googleMeetLink || '',
      isActive: g.isActive,
      maxStudents: (g as any).maxStudents ?? null,
      teacherId: ''   // leave blank → admin can pick new teacher or keep
    });
    this.form.get('subjectId')?.clearValidators();
    this.form.get('subjectId')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;

    if (this.editing()) {
      const dto: any = {
        nameAr:         v.nameAr!,
        nameEn:         v.nameEn!,
        googleMeetLink: v.googleMeetLink || '',
        isActive:       v.isActive ?? true,
        maxStudents:    v.maxStudents || undefined
      };
      // Only send teacherId if admin picked one
      if (v.teacherId) dto.teacherId = v.teacherId;

      this.adminSvc.updateGroup(this.editing()!.id, dto).subscribe({
        next: r => {
          this.saving.set(false);
          if (r.success) { this.toast.success('تم التعديل', 'Updated'); this.closeForm(); this.load(this.page()); }
        },
        error: () => this.saving.set(false)
      });
    } else {
      const dto = {
        nameAr:        v.nameAr!,
        nameEn:        v.nameEn!,
        subjectId:     v.subjectId!,
        gradeLevel:    v.gradeLevel!,
        curriculum:    v.curriculum!,
        teacherId:     v.teacherId!,
        googleMeetLink:v.googleMeetLink || '',
        maxStudents:   v.maxStudents || undefined
      };
      this.adminSvc.createGroup(dto).subscribe({
        next: r => {
          this.saving.set(false);
          if (r.success) { this.toast.success('تم إنشاء المجموعة', 'Group Created'); this.closeForm(); this.load(this.page()); }
        },
        error: () => this.saving.set(false)
      });
    }
  }

  confirmDelete(g: Group) { this.deleteTarget.set(g); this.deleteModal.set(true); }
  doDelete() {
    const g = this.deleteTarget();
    if (!g) return;
    this.saving.set(true);
    this.adminSvc.deleteGroup(g.id).subscribe({
      next: r => {
        this.saving.set(false);
        this.deleteModal.set(false);
        if (r.success) { this.toast.success('تم الحذف', 'Deleted'); this.load(this.page()); }
      },
      error: () => { this.saving.set(false); this.deleteModal.set(false); }
    });
  }

  copyInvite(g: Group) {
    const token = (g as any).teacherInviteToken ?? (g as any).inviteToken;
    if (!token) { this.toast.error('لا يوجد رابط دعوة', 'No invite token'); return; }
    const url = `${window.location.origin}/teacher/join/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copiedMsg.set(true);
      setTimeout(() => this.copiedMsg.set(false), 3000);
    });
  }

  regenerate(g: Group) {
    this.adminSvc.regenerateGroupInvite(g.id).subscribe(r => {
      if (r.success) {
        this.toast.success('تم تجديد رابط الدعوة', 'Invite link regenerated');
        this.load(this.page()); // reload to get fresh token
      }
    });
  }
}
