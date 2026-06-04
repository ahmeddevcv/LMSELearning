import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ParentService } from '../../../../core/services/api.services';
import { LanguageService } from '../../../../core/services/language.service';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { ParentChildDetail } from '../../../../core/models';

/** Parent — one child's full progress. Wired to GET /api/parent/children/{studentId}. */
@Component({
  selector: 'app-parent-child-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="page-fade">
      <a routerLink="/parent/children" class="btn btn-sm btn-link text-secondary mb-2 px-0">
        <i class="bi" [class]="isAr() ? 'bi-arrow-right' : 'bi-arrow-left'"></i> {{ isAr() ? 'رجوع للأبناء' : 'Back to children' }}
      </a>

      @if (loading()) {
        <app-skeleton type="card" [count]="3"/>
      } @else if (!child()) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          {{ isAr() ? 'تعذر تحميل بيانات الطالب' : 'Could not load student data' }}
        </div></div>
      } @else {
        <!-- Header -->
        <div class="card mb-4"><div class="card-body d-flex align-items-center gap-3">
          <div class="avatar" style="width:56px;height:56px;font-size:1.3rem">{{ child()!.fullNameAr.charAt(0) }}</div>
          <div>
            <h1 class="h4 mb-1">{{ isAr() ? child()!.fullNameAr : child()!.fullNameEn }}</h1>
            <div class="text-secondary" style="font-size:.85rem">
              <i class="bi bi-mortarboard me-1"></i>{{ gradeName(child()!.gradeLevel) }}
              <span class="mx-2">·</span>{{ curriculumName(child()!.curriculum) }}
            </div>
          </div>
        </div></div>

        <!-- Subscriptions -->
        <div class="card mb-4">
          <div class="card-header py-3"><strong style="font-size:.9rem"><i class="bi bi-journal-check me-2 text-primary"></i>{{ isAr() ? 'المواد المشترك بها' : 'Subscribed Subjects' }}</strong></div>
          <div class="table-responsive">
            <table class="table table-hover mb-0 table-cards">
              <thead><tr>
                <th>{{ isAr() ? 'المادة' : 'Subject' }}</th>
                <th>{{ isAr() ? 'المعلم' : 'Teacher' }}</th>
                <th>{{ isAr() ? 'الخطة' : 'Plan' }}</th>
                <th>{{ isAr() ? 'ينتهي في' : 'Ends' }}</th>
                <th>{{ isAr() ? 'الحالة' : 'Status' }}</th>
              </tr></thead>
              <tbody>
                @for (s of child()!.subscriptions; track $index) {
                  <tr>
                    <td class="fw-medium" style="font-size:.85rem" [attr.data-label]="isAr() ? 'المادة' : 'Subject'">{{ isAr() ? s.subjectNameAr : s.subjectNameEn }}</td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'المعلم' : 'Teacher'">{{ isAr() ? s.teacherNameAr : s.teacherNameEn }}</td>
                    <td style="font-size:.82rem" [attr.data-label]="isAr() ? 'الخطة' : 'Plan'">{{ planName(s.planType) }}</td>
                    <td class="text-secondary" style="font-size:.82rem" [attr.data-label]="isAr() ? 'ينتهي في' : 'Ends'">{{ s.endDate | date:'d MMM y' }}</td>
                    <td [attr.data-label]="isAr() ? 'الحالة' : 'Status'"><span class="badge bg-success">{{ isAr() ? 'نشط' : 'Active' }}</span></td>
                  </tr>
                }
                @if (!child()!.subscriptions.length) {
                  <tr><td colspan="5" class="cell-empty text-center py-4 text-secondary" style="font-size:.85rem">{{ isAr() ? 'لا توجد اشتراكات' : 'No subscriptions' }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="row g-4">
          <!-- Upcoming sessions -->
          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header py-3"><strong style="font-size:.9rem"><i class="bi bi-camera-video me-2 text-primary"></i>{{ isAr() ? 'الحصص القادمة' : 'Upcoming Sessions' }}</strong></div>
              <div class="list-group list-group-flush">
                @for (s of child()!.upcomingSessions; track $index) {
                  <div class="list-group-item py-3">
                    <div class="d-flex align-items-center justify-content-between gap-2">
                      <div class="min-w-0">
                        <div class="fw-medium text-truncate" style="font-size:.85rem">{{ isAr() ? s.titleAr : s.titleEn }}</div>
                        <small class="text-secondary"><i class="bi bi-clock me-1"></i>{{ s.scheduledAt | date:'EEE d MMM, h:mm a' }} · {{ s.durationMinutes }}{{ isAr()?'د':'m' }}</small>
                      </div>
                      <span class="badge" [class]="s.status==='Live' ? 'bg-success' : 'bg-primary'" style="font-size:.65rem">{{ statusName(s.status) }}</span>
                    </div>
                  </div>
                }
                @if (!child()!.upcomingSessions.length) {
                  <div class="text-center py-4 text-secondary" style="font-size:.85rem">{{ isAr() ? 'لا توجد حصص قادمة' : 'No upcoming sessions' }}</div>
                }
              </div>
            </div>
          </div>

          <!-- Recent assignments -->
          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header py-3"><strong style="font-size:.9rem"><i class="bi bi-clipboard-check me-2 text-primary"></i>{{ isAr() ? 'أحدث الواجبات' : 'Recent Assignments' }}</strong></div>
              <div class="list-group list-group-flush">
                @for (a of child()!.recentAssignments; track $index) {
                  <div class="list-group-item py-3">
                    <div class="fw-medium" style="font-size:.85rem">{{ isAr() ? a.titleAr : a.titleEn }}</div>
                    <small class="text-secondary">{{ a.totalMarks }} {{ isAr()?'درجة':'marks' }} · {{ isAr()?'التسليم':'Due' }} {{ a.deadline | date:'d MMM, h:mm a' }}</small>
                  </div>
                }
                @if (!child()!.recentAssignments.length) {
                  <div class="text-center py-4 text-secondary" style="font-size:.85rem">{{ isAr() ? 'لا توجد واجبات' : 'No assignments' }}</div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Monthly reports -->
        <div class="card mt-4">
          <div class="card-header py-3"><strong style="font-size:.9rem"><i class="bi bi-graph-up me-2 text-primary"></i>{{ isAr() ? 'التقارير الشهرية' : 'Monthly Reports' }}</strong></div>
          <div class="table-responsive">
            <table class="table table-hover mb-0 table-cards">
              <thead><tr>
                <th>{{ isAr() ? 'الشهر' : 'Month' }}</th>
                <th>{{ isAr() ? 'الحضور' : 'Attendance' }}</th>
                <th>{{ isAr() ? 'الواجبات' : 'Assignments' }}</th>
                <th>{{ isAr() ? 'النتيجة' : 'Overall' }}</th>
                <th>{{ isAr() ? 'التقدير' : 'Grade' }}</th>
              </tr></thead>
              <tbody>
                @for (r of child()!.reports; track $index) {
                  <tr>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'الشهر' : 'Month'">{{ r.month }}/{{ r.year }}</td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'الحضور' : 'Attendance'">{{ r.attendancePercentage }}%</td>
                    <td style="font-size:.85rem" [attr.data-label]="isAr() ? 'الواجبات' : 'Assignments'">{{ r.assignmentsPercentage }}%</td>
                    <td class="fw-semibold" style="font-size:.85rem" [attr.data-label]="isAr() ? 'النتيجة' : 'Overall'">{{ r.overallScore }}%</td>
                    <td [attr.data-label]="isAr() ? 'التقدير' : 'Grade'"><span class="badge bg-primary">{{ r.grade }}</span></td>
                  </tr>
                }
                @if (!child()!.reports.length) {
                  <tr><td colspan="5" class="cell-empty text-center py-4 text-secondary" style="font-size:.85rem">
                    {{ isAr() ? 'لا توجد تقارير بعد (تُنشأ تلقائيًا أول كل شهر)' : 'No reports yet (generated automatically on the 1st of each month)' }}
                  </td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class ChildDetailComponent implements OnInit {
  private readonly route     = inject(ActivatedRoute);
  private readonly parentSvc = inject(ParentService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly child   = signal<ParentChildDetail | null>(null);
  readonly loading = signal(true);

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.parentSvc.getChild(id).subscribe({
      next: r => { if (r.success && r.data) this.child.set(r.data); this.loading.set(false); },
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
  planName(p: string): string {
    const m: Record<string, [string, string]> = {
      Monthly: ['شهري', 'Monthly'], Semester: ['فصلي', 'Semester'], Yearly: ['سنوي', 'Yearly'],
    };
    const [ar, en] = m[p] ?? [p, p];
    return this.isAr() ? ar : en;
  }
  statusName(s: string): string {
    const m: Record<string, [string, string]> = {
      Scheduled: ['مجدولة', 'Scheduled'], Live: ['مباشر', 'Live'], Completed: ['منتهية', 'Completed'], Cancelled: ['ملغاة', 'Cancelled'],
    };
    const [ar, en] = m[s] ?? [s, s];
    return this.isAr() ? ar : en;
  }
}
