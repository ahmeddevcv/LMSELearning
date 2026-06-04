import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GroupService, ReportService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Group, MonthlyReport } from '../../../core/models';

/**
 * Teacher Reports — per-group monthly reports.
 * Reuses GET /api/reports/group/{groupId} which already allows Teacher+Admin auth.
 */
@Component({
  selector: 'app-teacher-reports',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'التقارير' : 'Reports' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'التقارير الشهرية لطلاب مجموعاتك' : "Monthly reports for your students" }}</p>
        </div>
      </div>

      @if (loadingGroups()) {
        <app-skeleton type="card"/>
      } @else if (!groups().length) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          <i class="bi bi-collection d-block mb-2 fs-1 opacity-40"></i>
          {{ isAr() ? 'لا توجد مجموعات' : 'No groups yet' }}
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
                    <small class="text-secondary" style="font-size:.72rem">{{ g.memberCount || 0 }} {{ isAr()?'طالب':'students' }}</small>
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="col-lg-8">
            <div class="card">
              <div class="card-header py-3"><strong style="font-size:.88rem">
                {{ selectedGroup() ? (isAr() ? selectedGroup()!.nameAr : selectedGroup()!.nameEn) : '—' }}
              </strong></div>
              <div class="table-responsive">
                <table class="table table-hover mb-0 table-cards">
                  <thead><tr>
                    <th>{{ isAr()?'الطالب':'Student' }}</th>
                    <th>{{ isAr()?'الشهر':'Month' }}</th>
                    <th>{{ isAr()?'الحضور':'Attendance' }}</th>
                    <th>{{ isAr()?'الواجبات':'Assignments' }}</th>
                    <th>{{ isAr()?'الإجمالي':'Overall' }}</th>
                    <th>{{ isAr()?'التقدير':'Grade' }}</th>
                  </tr></thead>
                  <tbody>
                    @if (loadingReports()) {
                      <tr><td colspan="6" class="cell-empty"><app-skeleton type="table" [count]="3"/></td></tr>
                    } @else if (!reports().length) {
                      <tr><td colspan="6" class="cell-empty text-center py-4 text-secondary" style="font-size:.85rem">
                        {{ isAr()?'لا توجد تقارير بعد. التقارير تُولَّد تلقائياً في بداية كل شهر.':'No reports yet. Reports are auto-generated at the start of each month.' }}
                      </td></tr>
                    } @else {
                      @for (r of reports(); track r.id) {
                        <tr>
                          <td [attr.data-label]="isAr()?'الطالب':'Student'"><span class="fw-medium" style="font-size:.85rem">{{ r.studentNameAr }}</span></td>
                          <td class="text-secondary" style="font-size:.78rem" [attr.data-label]="isAr()?'الشهر':'Month'">{{ r.month }}/{{ r.year }}</td>
                          <td [attr.data-label]="isAr()?'الحضور':'Attendance'">{{ r.attendanceScore | number:'1.0-1' }}%</td>
                          <td [attr.data-label]="isAr()?'الواجبات':'Assignments'">{{ r.assignmentScore | number:'1.0-1' }}%</td>
                          <td [attr.data-label]="isAr()?'الإجمالي':'Overall'"><strong>{{ r.overallScore | number:'1.0-1' }}%</strong></td>
                          <td [attr.data-label]="isAr()?'التقدير':'Grade'"><span class="badge bg-primary">{{ r.grade }}</span></td>
                        </tr>
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
  `
})
export class TeacherReportsComponent implements OnInit {
  private readonly groupSvc = inject(GroupService);
  private readonly reportSvc = inject(ReportService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly groups          = signal<Group[]>([]);
  readonly reports         = signal<MonthlyReport[]>([]);
  readonly selectedGroup   = signal<Group | null>(null);
  readonly loadingGroups   = signal(true);
  readonly loadingReports  = signal(false);

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe(r => {
      if (r.success && r.data) {
        this.groups.set(r.data);
        if (r.data.length > 0) this.selectGroup(r.data[0]);
      }
      this.loadingGroups.set(false);
    });
  }

  selectGroup(g: Group) {
    this.selectedGroup.set(g);
    this.loadingReports.set(true);
    this.reportSvc.getGroupReports(g.id).subscribe(r => {
      if (r.success && r.data) this.reports.set(r.data);
      this.loadingReports.set(false);
    });
  }
}
