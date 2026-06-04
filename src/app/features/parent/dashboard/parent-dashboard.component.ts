import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ParentService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ParentDashboard } from '../../../core/models';

/**
 * Parent dashboard — summary counters + a card per child.
 * Wired to GET /api/parent/dashboard (parent sees ONLY their own children).
 */
@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'لوحة ولي الأمر' : 'Parent Dashboard' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'متابعة أبنائك ومستواهم الدراسي' : 'Follow your children and their progress' }}</p>
        </div>
      </div>

      @if (loading()) {
        <app-skeleton type="card" [count]="3"/>
      } @else {
        <!-- Summary cards -->
        <div class="row g-3 mb-4">
          <div class="col-sm-4">
            <div class="card h-100"><div class="card-body d-flex align-items-center justify-content-between">
              <div>
                <div class="text-secondary" style="font-size:.8rem">{{ isAr() ? 'الأبناء' : 'Children' }}</div>
                <div class="stat-value fw-bold" style="font-size:1.6rem">{{ data()?.childrenCount ?? 0 }}</div>
              </div>
              <div class="avatar" style="width:42px;height:42px;background:var(--lms-primary-light)"><i class="bi bi-people-fill text-primary"></i></div>
            </div></div>
          </div>
          <div class="col-sm-4">
            <div class="card h-100"><div class="card-body d-flex align-items-center justify-content-between">
              <div>
                <div class="text-secondary" style="font-size:.8rem">{{ isAr() ? 'الاشتراكات النشطة' : 'Active Subscriptions' }}</div>
                <div class="stat-value fw-bold" style="font-size:1.6rem">{{ data()?.totalActiveSubscriptions ?? 0 }}</div>
              </div>
              <div class="avatar" style="width:42px;height:42px;background:#dcfce7"><i class="bi bi-journal-check text-success"></i></div>
            </div></div>
          </div>
          <div class="col-sm-4">
            <div class="card h-100"><div class="card-body d-flex align-items-center justify-content-between">
              <div>
                <div class="text-secondary" style="font-size:.8rem">{{ isAr() ? 'حصص قادمة' : 'Upcoming Sessions' }}</div>
                <div class="stat-value fw-bold" style="font-size:1.6rem">{{ data()?.upcomingSessions ?? 0 }}</div>
              </div>
              <div class="avatar" style="width:42px;height:42px;background:#fef9c3"><i class="bi bi-calendar-event text-warning"></i></div>
            </div></div>
          </div>
        </div>

        <!-- Children -->
        <h6 class="text-secondary mb-3">{{ isAr() ? 'أبنائي' : 'My Children' }}</h6>
        @if (!data()?.children?.length) {
          <div class="card"><div class="card-body text-center py-5 text-secondary">
            <i class="bi bi-people d-block mb-2 fs-1 opacity-25"></i>
            {{ isAr() ? 'لا يوجد أبناء مرتبطون بحسابك' : 'No children linked to your account' }}
          </div></div>
        } @else {
          <div class="row g-3">
            @for (c of data()!.children; track c.studentId) {
              <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                  <div class="card-body">
                    <div class="d-flex align-items-center gap-3 mb-3">
                      <div class="avatar" style="width:48px;height:48px;font-size:1.1rem">{{ c.fullNameAr.charAt(0) }}</div>
                      <div class="flex-grow-1 min-w-0">
                        <div class="fw-semibold text-truncate">{{ isAr() ? c.fullNameAr : c.fullNameEn }}</div>
                        <small class="text-secondary">{{ gradeName(c.gradeLevel) }} · {{ curriculumName(c.curriculum) }}</small>
                      </div>
                      @if (c.latestGrade) {
                        <span class="badge bg-primary" [title]="isAr() ? 'آخر تقدير' : 'Latest grade'">{{ c.latestGrade }}</span>
                      }
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="badge bg-success bg-opacity-10 text-success">
                        <i class="bi bi-journal-check me-1"></i>{{ c.activeSubscriptions }} {{ isAr() ? 'مادة' : 'subjects' }}
                      </span>
                    </div>
                    @if (c.subjects.length) {
                      <div class="d-flex flex-wrap gap-1 mb-3">
                        @for (s of c.subjects; track $index) {
                          <span class="badge bg-light text-dark border" style="font-size:.72rem">{{ isAr() ? (s.nameAr || s.subjectNameAr) : (s.nameEn || s.subjectNameEn) }}</span>
                        }
                      </div>
                    }
                    <a [routerLink]="['/parent/children', c.studentId]" class="btn btn-sm btn-outline-primary w-100">
                      <i class="bi bi-eye me-1"></i>{{ isAr() ? 'عرض التفاصيل' : 'View Details' }}
                    </a>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `
})
export class ParentDashboardComponent implements OnInit {
  private readonly parentSvc = inject(ParentService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly data    = signal<ParentDashboard | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    this.parentSvc.getDashboard().subscribe({
      next: r => { if (r.success && r.data) this.data.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  gradeName(g: string): string {
    if (!g) return '';
    return this.isAr() ? g.replace('Grade', 'الصف ').replace('KG', 'روضة ') : g.replace('Grade', 'Grade ');
  }
  curriculumName(c: string): string {
    const m: Record<string, [string, string]> = {
      Egyptian: ['المصري', 'Egyptian'], Gulf: ['الخليجي', 'Gulf'], IG: ['IG', 'IG'], American: ['الأمريكي', 'American'],
    };
    const [ar, en] = m[c] ?? [c, c];
    return this.isAr() ? ar : en;
  }
}
