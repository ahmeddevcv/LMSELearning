import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroupService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Group } from '../../../core/models';

@Component({
  selector: 'app-teacher-groups',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ConfirmModalComponent, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'مجموعاتي' : 'My Groups' }}</h1>
          <p class="section-subtitle">{{ groups().length }} {{ isAr() ? 'مجموعة' : 'groups' }}</p>
        </div>
        <button class="btn btn-primary" (click)="showForm.set(true)">
          <i class="bi bi-plus-lg"></i> {{ isAr() ? 'مجموعة جديدة' : 'New Group' }}
        </button>
      </div>

      @if (loading()) {
        <div class="row g-3">@for (i of [1,2,3]; track i) { <div class="col-md-6 col-xl-4"><app-skeleton type="card"/></div> }</div>
      } @else {
        <div class="row g-3">
          @for (g of groups(); track g.id) {
            <div class="col-md-6 col-xl-4">
              <div class="card h-100">
                <div class="card-body">
                  <div class="d-flex align-items-start justify-content-between mb-3">
                    <div class="d-flex align-items-center gap-3">
                      <div class="group-icon">{{ (isAr() ? g.nameAr : g.nameEn).charAt(0) }}</div>
                      <div>
                        <div class="fw-semibold">{{ isAr() ? g.nameAr : g.nameEn }}</div>
                        <div class="text-secondary" style="font-size:.78rem">{{ isAr() ? g.subjectNameAr : g.subjectNameEn }}</div>
                      </div>
                    </div>
                    <span class="badge" [class]="g.status==='Active' ? 'badge-active' : 'badge-inactive'">
                      {{ isAr() ? (g.status==='Active' ? 'نشط' : 'موقف') : g.status }}
                    </span>
                  </div>

                  <div class="row g-2 text-center mb-3">
                    @for (info of [{ v: g.memberCount, l: isAr()?'طالب':'Students' },{ v: g.gradeLevel, l: isAr()?'الصف':'Grade' },{ v: g.curriculum, l: isAr()?'المنهج':'Curr.' }]; track info.l) {
                      <div class="col-4">
                        <div class="p-2 rounded-3" style="background:var(--surface-3)">
                          <div class="fw-bold" style="font-size:.85rem">{{ info.v }}</div>
                          <div class="text-secondary" style="font-size:.7rem">{{ info.l }}</div>
                        </div>
                      </div>
                    }
                  </div>

                  @if (g.inviteToken) {
                    <div class="d-flex align-items-center gap-2 p-2 rounded-3 mb-3" style="background:var(--lms-primary-light)">
                      <span class="text-truncate flex-grow-1 small" style="color:var(--lms-primary);font-family:monospace;font-size:.75rem">/join/{{ g.inviteToken }}</span>
                      <button class="btn btn-sm p-0 px-2" style="color:var(--lms-primary);font-size:.75rem;font-weight:600"
                              (click)="copy(g.inviteToken!)">{{ isAr() ? 'نسخ' : 'Copy' }}</button>
                    </div>
                  }
                </div>
                <div class="card-footer bg-transparent d-flex gap-2">
                  <a [routerLink]="['/teacher/groups', g.id]" class="btn btn-primary btn-sm flex-fill">
                    {{ isAr() ? 'فتح' : 'Open' }}
                  </a>
                  <button class="btn btn-outline-danger btn-sm" (click)="confirmDelete(g)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          }
          @if (!groups().length && !loading()) {
            <div class="col-12">
              <div class="card"><div class="card-body text-center py-5 text-secondary">
                <i class="bi bi-collection d-block mb-3 fs-1 opacity-50"></i>
                <p class="mb-3">{{ isAr() ? 'لا توجد مجموعات بعد' : 'No groups yet' }}</p>
                <button class="btn btn-primary" (click)="showForm.set(true)">{{ isAr() ? 'إنشاء أول مجموعة' : 'Create first group' }}</button>
              </div></div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create modal -->
    @if (showForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isAr() ? 'إنشاء مجموعة جديدة' : 'Create New Group' }}</h5>
              <button type="button" class="btn-close" (click)="showForm.set(false)"></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="create()">
              <div class="modal-body">
                <div class="row g-3">
                  <div class="col-sm-6">
                    <label class="form-label">{{ isAr() ? 'الاسم (عربي)' : 'Arabic Name' }}</label>
                    <input formControlName="nameAr" class="form-control" placeholder="مجموعة الرياضيات">
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label">{{ isAr() ? 'الاسم (إنجليزي)' : 'English Name' }}</label>
                    <input formControlName="nameEn" class="form-control" placeholder="Math Group A">
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label">{{ isAr() ? 'الصف' : 'Grade' }}</label>
                    <select formControlName="gradeLevel" class="form-select">
                      @for (g of grades; track g) { <option [value]="g">{{ g }}</option> }
                    </select>
                  </div>
                  <div class="col-sm-6">
                    <label class="form-label">{{ isAr() ? 'المنهج' : 'Curriculum' }}</label>
                    <select formControlName="curriculum" class="form-select">
                      <option value="Egyptian">{{ isAr() ? 'المصري' : 'Egyptian' }}</option>
                      <option value="Gulf">{{ isAr() ? 'الخليج' : 'Gulf' }}</option>
                      <option value="IG">IG</option>
                      <option value="American">{{ isAr() ? 'الأمريكي' : 'American' }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="showForm.set(false)">{{ isAr() ? 'إلغاء' : 'Cancel' }}</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  {{ isAr() ? 'إنشاء' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <app-confirm-modal [open]="delModal()" [titleAr]="'حذف المجموعة'" [titleEn]="'Delete Group'"
      [messageAr]="'هل تريد حذف ' + (delTarget()?.nameAr ?? '') + '؟'"
      [messageEn]="'Delete ' + (delTarget()?.nameEn ?? '') + '?'"
      [loading]="saving()" (confirm)="doDelete()" (cancelled)="delModal.set(false)"/>
  `
})
export class TeacherGroupsComponent implements OnInit {
  private readonly groupSvc = inject(GroupService);
  private readonly toast    = inject(ToastService);
  private readonly fb       = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly groups   = signal<Group[]>([]);
  readonly loading  = signal(true);
  readonly saving   = signal(false);
  readonly showForm = signal(false);
  readonly delModal = signal(false);
  readonly delTarget= signal<Group | null>(null);

  readonly grades = ['KG1','KG2','Grade1','Grade2','Grade3','Grade4','Grade5','Grade6','Grade7','Grade8','Grade9','Grade10','Grade11','Grade12'];

  form = this.fb.group({
    nameAr:     ['', Validators.required],
    nameEn:     ['', Validators.required],
    gradeLevel: ['Grade1'],
    curriculum: ['Egyptian'],
  });

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe(r => {
      if (r.success && r.data) this.groups.set(r.data);
      this.loading.set(false);
    });
  }

  create() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.groupSvc.createGroup(this.form.value as any).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) { this.toast.success('تم الإنشاء','Created'); this.showForm.set(false); if (r.data) this.groups.update(gs => [r.data!, ...gs]); }
      },
      error: () => this.saving.set(false)
    });
  }

  copy(token: string) {
    navigator.clipboard.writeText(location.origin + '/join/' + token);
    this.toast.info('تم النسخ','Copied','رابط الدعوة','Invite link copied');
  }

  confirmDelete(g: Group) { this.delTarget.set(g); this.delModal.set(true); }
  doDelete() {
    if (!this.delTarget()) return;
    this.saving.set(true);
    this.groupSvc.deleteGroup(this.delTarget()!.id).subscribe({
      next: r => {
        this.saving.set(false); this.delModal.set(false);
        if (r.success) { this.toast.success('تم الحذف','Deleted'); this.groups.update(gs => gs.filter(g => g.id !== this.delTarget()!.id)); }
      },
      error: () => this.saving.set(false)
    });
  }
}
