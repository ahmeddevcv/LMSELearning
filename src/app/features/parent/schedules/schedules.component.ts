import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParentService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ParentSession } from '../../../core/models';

/** Parent — upcoming sessions across all children. Wired to GET /api/parent/schedules. */
@Component({
  selector: 'app-parent-schedules',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'المواعيد' : 'Schedules' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'حصص أبنائك القادمة والمباشرة' : "Your children's upcoming & live sessions" }}</p>
        </div>
      </div>

      @if (loading()) {
        <app-skeleton type="card" [count]="3"/>
      } @else if (!sessions().length) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          <i class="bi bi-calendar-x d-block mb-2 fs-1 opacity-25"></i>
          {{ isAr() ? 'لا توجد حصص قادمة' : 'No upcoming sessions' }}
        </div></div>
      } @else {
        <div class="d-flex flex-column gap-3">
          @for (s of sessions(); track $index) {
            <div class="card"><div class="card-body d-flex align-items-center gap-3">
              <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                   style="width:48px;height:48px"
                   [style.background]="s.status==='Live' ? '#fee2e2' : 'var(--lms-primary-light)'">
                <i class="bi fs-5" [class]="s.status==='Live' ? 'bi-record-circle-fill text-danger' : 'bi-calendar3 text-primary'"></i>
              </div>
              <div class="flex-grow-1 min-w-0">
                <div class="fw-semibold">{{ isAr() ? s.titleAr : s.titleEn }}</div>
                <div class="text-secondary" style="font-size:.8rem">
                  <i class="bi bi-person me-1"></i>{{ isAr() ? s.childNameAr : s.childNameEn }}
                  <span class="mx-1">·</span>{{ isAr() ? s.groupNameAr : s.groupNameEn }}
                </div>
                <div class="text-secondary" style="font-size:.78rem">
                  <i class="bi bi-clock me-1"></i>{{ s.scheduledAt | date:'EEEE d MMM, h:mm a' }} · {{ s.durationMinutes }} {{ isAr()?'دقيقة':'min' }}
                </div>
              </div>
              <div class="d-flex flex-column align-items-end gap-2">
                <span class="badge" [class]="s.status==='Live' ? 'bg-success' : 'bg-primary'">{{ statusName(s.status) }}</span>
                @if (s.status==='Live' && s.meetLink) {
                  <a [href]="s.meetLink" target="_blank" class="btn btn-sm btn-danger">{{ isAr() ? 'انضمام' : 'Join' }}</a>
                }
              </div>
            </div></div>
          }
        </div>
      }
    </div>
  `
})
export class SchedulesComponent implements OnInit {
  private readonly parentSvc = inject(ParentService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly sessions = signal<ParentSession[]>([]);
  readonly loading  = signal(true);

  ngOnInit() {
    this.parentSvc.getSchedules().subscribe({
      next: r => { if (r.success && r.data) this.sessions.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusName(s: string): string {
    const m: Record<string, [string, string]> = {
      Scheduled: ['مجدولة', 'Scheduled'], Live: ['مباشر', 'Live'], Completed: ['منتهية', 'Completed'], Cancelled: ['ملغاة', 'Cancelled'],
    };
    const [ar, en] = m[s] ?? [s, s];
    return this.isAr() ? ar : en;
  }
}
