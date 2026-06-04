import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GroupService, SessionService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Group, Session } from '../../../core/models';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الرئيسية' : 'Dashboard' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'مرحباً بك مجدداً' : 'Welcome back' }}</p>
        </div>
        <a routerLink="/teacher/sessions" class="btn btn-primary">
          <i class="bi bi-plus-lg"></i> {{ isAr() ? 'جدولة حصة' : 'Schedule Session' }}
        </a>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe"><i class="bi bi-collection text-primary fs-4"></i></div>
            <div><div class="stat-label">{{ isAr() ? 'مجموعاتي' : 'My Groups' }}</div><div class="stat-value">{{ groups().length }}</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon" style="background:#dcfce7"><i class="bi bi-camera-video fs-4" style="color:#16a34a"></i></div>
            <div><div class="stat-label">{{ isAr() ? 'حصص قادمة' : 'Upcoming' }}</div><div class="stat-value">{{ upcoming().length }}</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon" style="background:#f3e8ff"><i class="bi bi-people fs-4" style="color:#9333ea"></i></div>
            <div><div class="stat-label">{{ isAr() ? 'الطلاب' : 'Students' }}</div><div class="stat-value">{{ totalStudents() }}</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon" style="background:#fef3c7"><i class="bi bi-star fs-4" style="color:#d97706"></i></div>
            <div><div class="stat-label">{{ isAr() ? 'التقييم' : 'Rating' }}</div><div class="stat-value">{{ averageRating() }}</div></div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header py-3 d-flex align-items-center justify-content-between">
              <strong style="font-size:.9rem">{{ isAr() ? 'الحصص القادمة' : 'Upcoming Sessions' }}</strong>
              <a routerLink="/teacher/sessions" class="btn btn-sm btn-link p-0" style="font-size:.8rem">{{ isAr() ? 'عرض الكل' : 'View all' }}</a>
            </div>
            <div class="card-body p-0">
              @if (loadingSessions()) { <div class="p-3"><app-skeleton type="list" [count]="3"/></div> }
              @else {
                @for (s of upcoming().slice(0,4); track s.id) {
                  <div class="d-flex align-items-start gap-3 px-4 py-3 border-bottom" style="border-color:var(--border-color)!important">
                    <div class="rounded-3 d-flex flex-column align-items-center justify-content-center flex-shrink-0"
                         style="width:44px;height:44px;background:var(--lms-primary-light);color:var(--lms-primary)">
                      <div class="fw-bold lh-1" style="font-size:.9rem">{{ s.scheduledAt | date:'d' }}</div>
                      <div style="font-size:.65rem">{{ s.scheduledAt | date:'MMM' }}</div>
                    </div>
                    <div class="flex-grow-1 min-w-0">
                      <div class="fw-medium" style="font-size:.875rem">{{ isAr() ? s.titleAr : s.titleEn }}</div>
                      <div class="text-secondary" style="font-size:.75rem">{{ s.scheduledAt | date:'h:mm a' }} · {{ isAr() ? s.groupNameAr : s.groupNameEn }}</div>
                    </div>
                    <span class="badge badge-scheduled">{{ s.durationMinutes }}{{ isAr() ? 'د' : 'm' }}</span>
                  </div>
                }
                @if (!upcoming().length) {
                  <div class="text-center py-5 text-secondary" style="font-size:.85rem">
                    <i class="bi bi-calendar-x d-block mb-2 fs-3 opacity-50"></i>
                    {{ isAr() ? 'لا توجد حصص قادمة' : 'No upcoming sessions' }}
                  </div>
                }
              }
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card">
            <div class="card-header py-3 d-flex align-items-center justify-content-between">
              <strong style="font-size:.9rem">{{ isAr() ? 'مجموعاتي' : 'My Groups' }}</strong>
              <a routerLink="/teacher/groups" class="btn btn-sm btn-link p-0" style="font-size:.8rem">{{ isAr() ? 'عرض الكل' : 'View all' }}</a>
            </div>
            <div class="card-body p-0">
              @if (loadingGroups()) { <div class="p-3"><app-skeleton type="list" [count]="3"/></div> }
              @else {
                @for (g of groups().slice(0,5); track g.id) {
                  <a [routerLink]="['/teacher/groups', g.id]"
                     class="d-flex align-items-center gap-3 px-4 py-3 border-bottom text-decoration-none"
                     style="border-color:var(--border-color)!important;color:inherit;transition:.15s"
                     onmouseover="this.style.background='var(--surface-3)'" onmouseout="this.style.background=''">
                    <div class="group-icon">{{ (isAr() ? g.nameAr : g.nameEn).charAt(0) }}</div>
                    <div class="flex-grow-1">
                      <div class="fw-medium" style="font-size:.875rem">{{ isAr() ? g.nameAr : g.nameEn }}</div>
                      <div class="text-secondary" style="font-size:.75rem">{{ g.memberCount }} {{ isAr() ? 'طالب' : 'students' }}</div>
                    </div>
                    <span class="badge" [class]="g.status==='Active' ? 'badge-active' : 'badge-inactive'">
                      {{ isAr() ? (g.status==='Active' ? 'نشط' : 'موقف') : g.status }}
                    </span>
                  </a>
                }
                @if (!groups().length) {
                  <div class="text-center py-5 text-secondary" style="font-size:.85rem">
                    <i class="bi bi-collection d-block mb-2 fs-3 opacity-50"></i>
                    {{ isAr() ? 'لا توجد مجموعات' : 'No groups yet' }}
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TeacherDashboardComponent implements OnInit {
  private readonly groupSvc   = inject(GroupService);
  private readonly sessionSvc = inject(SessionService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly groups   = signal<Group[]>([]);
  readonly upcoming = signal<Session[]>([]);
  readonly allSessions = signal<Session[]>([]);
  readonly loadingGroups   = signal(true);
  readonly loadingSessions = signal(true);

  totalStudents = () => this.groups().reduce((s, g) => s + g.memberCount, 0);

  /** Average rating across all completed sessions that have ratings. Returns '—' if none. */
  averageRating = () => {
    const rated = this.allSessions().filter(s => s.averageRating != null && s.averageRating > 0);
    if (rated.length === 0) return '—';
    const avg = rated.reduce((a, s) => a + (s.averageRating || 0), 0) / rated.length;
    return avg.toFixed(1);
  };

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe(r => {
      if (r.success && r.data) {
        this.groups.set(r.data);
        let pend = r.data.length;
        if (!pend) { this.loadingSessions.set(false); return; }
        r.data.forEach(g => {
          this.sessionSvc.getGroupSessions(g.id).subscribe(sr => {
            if (sr.success && sr.data) {
              this.allSessions.update(all => [...all, ...sr.data!]);
              const up = sr.data.filter(s => s.status==='Scheduled' && new Date(s.scheduledAt) > new Date());
              this.upcoming.update(all => [...all, ...up]);
            }
            if (--pend === 0) this.loadingSessions.set(false);
          });
        });
      }
      this.loadingGroups.set(false);
    });
  }
}
