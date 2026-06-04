import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroupService, SessionService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Group, Session } from '../../../core/models';

/**
 * Teacher Sessions page — full CRUD + start/end actions.
 *
 * UX: a sidebar list picks which of the teacher's groups to view; the right
 * panel shows that group's sessions ordered by scheduledAt desc and offers
 * create/edit/delete/start/end actions. Backend already enforces that the teacher
 * can only act on their own group's sessions.
 */
@Component({
  selector: 'app-teacher-sessions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الحصص' : 'Sessions' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'إدارة حصص مجموعاتك' : 'Manage your group sessions' }}</p>
        </div>
        <button class="btn btn-primary" [disabled]="!selectedGroup()" (click)="openCreate()">
          <i class="bi bi-plus-lg me-1"></i>{{ isAr() ? 'حصة جديدة' : 'New Session' }}
        </button>
      </div>

      @if (loadingGroups()) {
        <app-skeleton type="card"/>
      } @else if (!groups().length) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          <i class="bi bi-collection d-block mb-2 fs-1 opacity-40"></i>
          {{ isAr() ? 'لا توجد مجموعات بعد' : 'No groups yet' }}
        </div></div>
      } @else {
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="card">
              <div class="card-header py-3"><strong style="font-size:.88rem">{{ isAr() ? 'مجموعاتي' : 'My Groups' }}</strong></div>
              <div class="list-group list-group-flush">
                @for (g of groups(); track g.id) {
                  <button class="list-group-item list-group-item-action border-0 px-4 py-3"
                          [style.background]="selectedGroup()?.id===g.id?'var(--lms-primary-light)':''"
                          (click)="selectGroup(g)" style="text-align:inherit">
                    <div class="fw-semibold" style="font-size:.85rem">{{ isAr() ? g.nameAr : g.nameEn }}</div>
                    <small class="text-secondary" style="font-size:.72rem">
                      {{ isAr() ? g.subjectNameAr : g.subjectNameEn }} · {{ g.memberCount || 0 }} {{ isAr() ? 'طالب' : 'students' }}
                    </small>
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-8">
            <div class="card">
              <div class="card-header py-3 d-flex align-items-center justify-content-between">
                <strong style="font-size:.88rem">
                  {{ selectedGroup() ? (isAr() ? selectedGroup()!.nameAr : selectedGroup()!.nameEn) : (isAr() ? 'اختر مجموعة' : 'Select a group') }}
                </strong>
                <small class="text-secondary">{{ sessions().length }} {{ isAr() ? 'حصة' : 'sessions' }}</small>
              </div>
              <div class="table-responsive">
                <table class="table table-hover mb-0 table-cards">
                  <thead><tr>
                    <th>{{ isAr() ? 'العنوان' : 'Title' }}</th>
                    <th>{{ isAr() ? 'الموعد' : 'Scheduled' }}</th>
                    <th>{{ isAr() ? 'المدة' : 'Duration' }}</th>
                    <th>{{ isAr() ? 'الحالة' : 'Status' }}</th>
                    <th></th>
                  </tr></thead>
                  <tbody>
                    @if (loadingSessions()) {
                      <tr><td colspan="5" class="cell-empty"><app-skeleton type="table" [count]="3"/></td></tr>
                    } @else {
                      @for (s of sessions(); track s.id) {
                        <tr>
                          <td [attr.data-label]="isAr() ? 'العنوان' : 'Title'"><span class="fw-medium" style="font-size:.85rem">{{ isAr() ? s.titleAr : s.titleEn }}</span></td>
                          <td class="text-secondary" style="font-size:.78rem" [attr.data-label]="isAr() ? 'الموعد' : 'Scheduled'">{{ s.scheduledAt | date:'d MMM, h:mm a' }}</td>
                          <td class="text-secondary" style="font-size:.78rem" [attr.data-label]="isAr() ? 'المدة' : 'Duration'">{{ s.durationMinutes }} {{ isAr()?'د':'min' }}</td>
                          <td [attr.data-label]="isAr() ? 'الحالة' : 'Status'"><span class="badge" [class]="statusClass(s.status)" style="font-size:.7rem">{{ statusLabel(s.status) }}</span></td>
                          <td class="cell-actions text-end">
                            @if (s.status === 'Scheduled') {
                              <button class="btn btn-sm btn-success me-1" (click)="start(s)" [title]="isAr()?'بدء':'Start'"><i class="bi bi-play-fill"></i></button>
                            }
                            @if (s.status === 'Live') {
                              <button class="btn btn-sm btn-danger me-1" (click)="end(s)" [title]="isAr()?'إنهاء':'End'"><i class="bi bi-stop-fill"></i></button>
                            }
                            @if (s.meetLink) {
                              <a class="btn btn-sm btn-outline-primary me-1" [href]="s.meetLink" target="_blank" [title]="isAr()?'فتح Meet':'Open Meet'"><i class="bi bi-camera-video"></i></a>
                            }
                            <button class="btn btn-sm btn-outline-secondary me-1" (click)="openEdit(s)" [title]="isAr()?'تعديل':'Edit'"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-outline-danger" (click)="deleteSession(s)" [title]="isAr()?'حذف':'Delete'"><i class="bi bi-trash"></i></button>
                          </td>
                        </tr>
                      }
                      @if (!sessions().length && selectedGroup()) {
                        <tr><td colspan="5" class="cell-empty text-center py-4 text-secondary" style="font-size:.85rem">{{ isAr()?'لا توجد حصص':'No sessions yet' }}</td></tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    @if (showForm()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editing() ? (isAr()?'تعديل حصة':'Edit Session') : (isAr()?'حصة جديدة':'New Session') }}</h5>
              <button type="button" class="btn-close" (click)="showForm.set(false)"></button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()">
              <div class="modal-body">
                <div class="mb-3"><label class="form-label small">{{ isAr()?'العنوان (عربي)':'Title (AR)' }}</label>
                  <input formControlName="titleAr" class="form-control"></div>
                <div class="mb-3"><label class="form-label small">{{ isAr()?'العنوان (إنجليزي)':'Title (EN)' }}</label>
                  <input formControlName="titleEn" class="form-control"></div>
                <div class="row g-3 mb-3">
                  <div class="col-7"><label class="form-label small">{{ isAr()?'الموعد':'Scheduled At' }}</label>
                    <input type="datetime-local" formControlName="scheduledAt" class="form-control"></div>
                  <div class="col-5"><label class="form-label small">{{ isAr()?'المدة (دقيقة)':'Duration (min)' }}</label>
                    <input type="number" formControlName="durationMinutes" class="form-control" min="15" max="480"></div>
                </div>
                <div class="mb-3"><label class="form-label small">{{ isAr()?'رابط Google Meet (اختياري)':'Meet Link (optional)' }}</label>
                  <input formControlName="meetLink" class="form-control" placeholder="https://meet.google.com/..."></div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" (click)="showForm.set(false)">{{ isAr()?'إلغاء':'Cancel' }}</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving() || form.invalid">
                  @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  {{ isAr()?'حفظ':'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class SessionsComponent implements OnInit {
  private readonly groupSvc   = inject(GroupService);
  private readonly sessionSvc = inject(SessionService);
  private readonly toast      = inject(ToastService);
  private readonly fb         = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly groups          = signal<Group[]>([]);
  readonly sessions        = signal<Session[]>([]);
  readonly selectedGroup   = signal<Group | null>(null);
  readonly loadingGroups   = signal(true);
  readonly loadingSessions = signal(false);
  readonly showForm        = signal(false);
  readonly saving          = signal(false);
  readonly editing         = signal<Session | null>(null);

  form = this.fb.group({
    titleAr: ['', Validators.required],
    titleEn: ['', Validators.required],
    scheduledAt: ['', Validators.required],
    durationMinutes: [60, [Validators.required, Validators.min(15), Validators.max(480)]],
    meetLink: [''],
  });

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe(r => {
      if (r.success && r.data) {
        this.groups.set(r.data);
        if (r.data.length > 0) this.selectGroup(r.data[0]);
      }
      this.loadingGroups.set(false);
    });
  }

  selectGroup(g: Group) { this.selectedGroup.set(g); this.loadSessions(); }

  loadSessions() {
    const gid = this.selectedGroup()?.id;
    if (!gid) return;
    this.loadingSessions.set(true);
    this.sessionSvc.getGroupSessions(gid).subscribe(r => {
      if (r.success && r.data) this.sessions.set(r.data);
      this.loadingSessions.set(false);
    });
  }

  openCreate() {
    this.editing.set(null);
    const d = new Date(); d.setHours(d.getHours() + 1); d.setMinutes(0, 0, 0);
    this.form.reset({ durationMinutes: 60, scheduledAt: this.toLocalInput(d) } as any);
    this.showForm.set(true);
  }

  openEdit(s: Session) {
    this.editing.set(s);
    this.form.patchValue({
      titleAr: s.titleAr, titleEn: s.titleEn,
      scheduledAt: this.toLocalInput(new Date(s.scheduledAt)),
      durationMinutes: s.durationMinutes,
      meetLink: s.meetLink || '',
    });
    this.showForm.set(true);
  }

  save() {
    if (this.form.invalid || !this.selectedGroup()) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const payload: any = {
      groupId: this.selectedGroup()!.id,
      titleAr: v.titleAr,
      titleEn: v.titleEn,
      scheduledAt: new Date(v.scheduledAt!).toISOString(),
      durationMinutes: v.durationMinutes,
      meetLink: v.meetLink || undefined,
    };
    const obs = this.editing()
      ? this.sessionSvc.updateSession(this.editing()!.id, payload)
      : this.sessionSvc.createSession(payload);
    obs.subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.toast.success('تم', 'Saved');
          this.showForm.set(false);
          this.loadSessions();
        }
      },
      error: () => this.saving.set(false),
    });
  }

  start(s: Session) {
    this.sessionSvc.startSession(s.id).subscribe(r => {
      if (r.success) { this.toast.success('بدأت الحصة', 'Session started'); this.loadSessions(); }
    });
  }

  end(s: Session) {
    if (!confirm(this.isAr() ? 'إنهاء الحصة الآن؟' : 'End session now?')) return;
    this.sessionSvc.endSession(s.id).subscribe(r => {
      if (r.success) { this.toast.success('انتهت الحصة', 'Session ended'); this.loadSessions(); }
    });
  }

  deleteSession(s: Session) {
    if (!confirm(this.isAr() ? `حذف "${s.titleAr}"؟` : `Delete "${s.titleEn}"?`)) return;
    this.sessionSvc.deleteSession(s.id).subscribe(r => {
      if (r.success) { this.toast.success('تم الحذف', 'Deleted'); this.loadSessions(); }
    });
  }

  statusClass(s: string) {
    return s === 'Live' ? 'bg-success' : s === 'Completed' ? 'bg-secondary' : s === 'Cancelled' ? 'bg-danger' : 'bg-primary';
  }
  statusLabel(s: string) {
    const map: Record<string,[string,string]> = {
      Scheduled: ['مجدولة','Scheduled'], Live: ['جارية','Live'], Completed: ['منتهية','Completed'], Cancelled: ['ملغاة','Cancelled']
    };
    const [ar, en] = map[s] ?? [s, s];
    return this.isAr() ? ar : en;
  }

  private toLocalInput(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
