import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GroupService, SessionService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Session } from '../../../core/models';

/**
 * Student Sessions — unified list of sessions across all my groups.
 * Includes a 5-star rating modal for completed sessions (POST /sessions/{id}/rate).
 */
@Component({
  selector: 'app-student-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, DatePipe],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الحصص' : 'Sessions' }}</h1>
          <p class="section-subtitle">{{ sessions().length }} {{ isAr() ? 'حصة عبر جميع مجموعاتك' : 'sessions across all your groups' }}</p>
        </div>
      </div>

      <!-- Filter pills -->
      <div class="d-flex gap-2 mb-3 flex-wrap">
        @for (f of filters; track f.id) {
          <button class="btn btn-sm" [class.btn-primary]="filter() === f.id" [class.btn-outline-secondary]="filter() !== f.id" (click)="filter.set(f.id)">
            {{ isAr() ? f.ar : f.en }}
          </button>
        }
      </div>

      @if (loading()) { <app-skeleton type="table" [count]="5"/> }
      @else if (!filtered().length) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          {{ isAr() ? 'لا توجد حصص في هذا التصنيف' : 'No sessions in this filter' }}
        </div></div>
      } @else {
        <div class="card">
          <div class="table-responsive">
            <table class="table table-hover mb-0 table-cards">
              <thead><tr>
                <th>{{ isAr() ? 'الحصة' : 'Session' }}</th>
                <th>{{ isAr() ? 'المجموعة' : 'Group' }}</th>
                <th>{{ isAr() ? 'الموعد' : 'Time' }}</th>
                <th>{{ isAr() ? 'الحالة' : 'Status' }}</th>
                <th></th>
              </tr></thead>
              <tbody>
                @for (s of filtered(); track s.id) {
                  <tr>
                    <td [attr.data-label]="isAr() ? 'الحصة' : 'Session'"><span class="fw-medium" style="font-size:.85rem">{{ isAr() ? s.titleAr : s.titleEn }}</span></td>
                    <td class="text-secondary" style="font-size:.78rem" [attr.data-label]="isAr() ? 'المجموعة' : 'Group'">{{ isAr() ? s.groupNameAr : s.groupNameEn }}</td>
                    <td class="text-secondary" style="font-size:.78rem" [attr.data-label]="isAr() ? 'الموعد' : 'Time'">{{ s.scheduledAt | date:'d MMM, h:mm a' }}</td>
                    <td [attr.data-label]="isAr() ? 'الحالة' : 'Status'"><span class="badge" [class]="badge(s.status)" style="font-size:.7rem">{{ statusLabel(s.status) }}</span></td>
                    <td class="cell-actions text-end">
                      @if (s.status === 'Live' && s.meetLink) {
                        <a [href]="s.meetLink" target="_blank" class="btn btn-sm btn-success"><i class="bi bi-camera-video me-1"></i>{{ isAr()?'انضمام':'Join' }}</a>
                      } @else if (s.status === 'Completed') {
                        @if (s.myRating) {
                          <span class="text-warning">⭐ {{ s.myRating }}/5</span>
                        } @else {
                          <button class="btn btn-sm btn-outline-warning" (click)="openRate(s)"><i class="bi bi-star me-1"></i>{{ isAr()?'تقييم':'Rate' }}</button>
                        }
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>

    @if (ratingTarget()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title">{{ isAr() ? 'تقييم الحصة' : 'Rate Session' }}</h6>
              <button class="btn-close" (click)="ratingTarget.set(null)"></button>
            </div>
            <div class="modal-body">
              <div class="d-flex gap-2 justify-content-center mb-3" style="font-size:2rem;cursor:pointer">
                @for (n of [1,2,3,4,5]; track n) {
                  <i class="bi" [class.bi-star-fill]="rating() >= n" [class.bi-star]="rating() < n" [style.color]="rating() >= n ? '#fbbf24' : '#d1d5db'" (click)="rating.set(n)"></i>
                }
              </div>
              <textarea [(ngModel)]="comment" class="form-control" rows="3" [placeholder]="isAr()?'تعليق (اختياري)':'Comment (optional)'"></textarea>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline-secondary" (click)="ratingTarget.set(null)">{{ isAr()?'إلغاء':'Cancel' }}</button>
              <button class="btn btn-primary" [disabled]="rating() === 0 || submitting()" (click)="submitRating()">
                @if (submitting()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                {{ isAr()?'إرسال':'Submit' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class StudentSessionsComponent implements OnInit {
  private readonly groupSvc   = inject(GroupService);
  private readonly sessionSvc = inject(SessionService);
  private readonly toast      = inject(ToastService);
  private readonly route      = inject(ActivatedRoute);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly sessions  = signal<Session[]>([]);
  readonly loading   = signal(true);
  readonly filter    = signal<'upcoming'|'live'|'completed'|'all'>('upcoming');

  readonly filters = [
    { id: 'upcoming' as const,  ar: 'القادمة',  en: 'Upcoming' },
    { id: 'live' as const,      ar: 'جارية',    en: 'Live' },
    { id: 'completed' as const, ar: 'منتهية',   en: 'Completed' },
    { id: 'all' as const,       ar: 'الكل',     en: 'All' },
  ];

  // Rating modal state
  readonly ratingTarget = signal<Session | null>(null);
  readonly rating       = signal(0);
  comment = '';
  readonly submitting   = signal(false);

  filtered = () => {
    const all = this.sessions();
    switch (this.filter()) {
      case 'upcoming':  return all.filter(s => s.status === 'Scheduled');
      case 'live':      return all.filter(s => s.status === 'Live');
      case 'completed': return all.filter(s => s.status === 'Completed');
      default:          return all;
    }
  };

  ngOnInit() {
    // Honor ?filter=upcoming|live|completed|all from URL (notification deep-links land here)
    this.route.queryParamMap.subscribe(params => {
      const f = params.get('filter');
      if (f === 'upcoming' || f === 'live' || f === 'completed' || f === 'all') {
        this.filter.set(f);
      }
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    // Fan out: get every group, then sessions per group, then flatten.
    this.groupSvc.getMyGroups().subscribe(gr => {
      if (!gr.success || !gr.data || gr.data.length === 0) {
        this.sessions.set([]); this.loading.set(false); return;
      }
      const calls = gr.data.map(g => this.sessionSvc.getGroupSessions(g.id).pipe(
        map(r => r.success && r.data ? r.data : []),
        catchError(() => of([] as Session[]))
      ));
      forkJoin(calls).subscribe(perGroup => {
        const merged = perGroup.flat().sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
        this.sessions.set(merged);
        this.loading.set(false);
      });
    });
  }

  openRate(s: Session) {
    this.ratingTarget.set(s);
    this.rating.set(0);
    this.comment = '';
  }

  submitRating() {
    const s = this.ratingTarget();
    if (!s || this.rating() === 0) return;
    this.submitting.set(true);
    this.sessionSvc.rateSession(s.id, this.rating(), this.comment).subscribe({
      next: r => {
        this.submitting.set(false);
        if (r.success) {
          this.toast.success('شكراً لتقييمك', 'Thanks for rating');
          // optimistic: mark in local state
          const r2 = this.rating();
          this.sessions.update(arr => arr.map(x => x.id === s.id ? { ...x, myRating: r2 } : x));
          this.ratingTarget.set(null);
        }
      },
      error: () => this.submitting.set(false),
    });
  }

  badge(s: string) {
    return s === 'Live' ? 'bg-success' : s === 'Completed' ? 'bg-secondary' : s === 'Cancelled' ? 'bg-danger' : 'bg-primary';
  }
  statusLabel(s: string) {
    const m: Record<string,[string,string]> = { Scheduled:['مجدولة','Scheduled'], Live:['جارية','Live'], Completed:['منتهية','Completed'], Cancelled:['ملغاة','Cancelled'] };
    const [ar, en] = m[s] ?? [s, s];
    return this.isAr() ? ar : en;
  }
}
