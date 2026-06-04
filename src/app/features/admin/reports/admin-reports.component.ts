import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { MonthlyReport } from '../../../core/models';
import { ScoreBarComponent } from '../../../shared/components/score-bar/score-bar.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, PaginationComponent, ScoreBarComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'التقارير' : 'Reports' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'تقارير الطلاب الشهرية' : 'Monthly student reports' }}</p>
        </div>
        <button class="btn btn-outline-primary" (click)="exportExcel()" [disabled]="exporting()">
          @if (exporting()) { <span class="spinner-border spinner-border-sm me-2"></span> }
          <i class="bi bi-file-earmark-excel me-1"></i>
          {{ isAr() ? 'تصدير Excel' : 'Export Excel' }}
        </button>
      </div>

      <!-- Filters -->
      <div class="card mb-3 p-3">
        <div class="row g-2 align-items-center">
          <div class="col-auto">
            <select class="form-select form-select-sm" [(ngModel)]="selMonth" (ngModelChange)="load(1)">
              @for (m of months; track m.v) {
                <option [value]="m.v">{{ isAr()?m.ar:m.en }}</option>
              }
            </select>
          </div>
          <div class="col-auto">
            <select class="form-select form-select-sm" [(ngModel)]="selYear" (ngModelChange)="load(1)">
              @for (y of years; track y) { <option [value]="y">{{ y }}</option> }
            </select>
          </div>
          <div class="col-auto ms-auto">
            <div class="d-flex align-items-center gap-3 text-secondary" style="font-size:.82rem">
              <span><i class="bi bi-people me-1"></i>{{ total() }} {{ isAr()?'طالب':'students' }}</span>
              <span><i class="bi bi-graph-up me-1"></i>{{ isAr()?'متوسط:':'Avg:' }} {{ avgScore() | number:'1.0-1' }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0 table-cards">
            <thead><tr>
              <th>{{ isAr()?'الطالب':'Student' }}</th>
              <th>{{ isAr()?'الحضور':'Attendance' }}</th>
              <th>{{ isAr()?'الواجبات':'Assignments' }}</th>
              <th>{{ isAr()?'الاختبارات':'Quizzes' }}</th>
              <th>{{ isAr()?'المشاركة':'Participation' }}</th>
              <th>{{ isAr()?'الإجمالي':'Overall' }}</th>
              <th>{{ isAr()?'التقدير':'Grade' }}</th>
            </tr></thead>
            <tbody>
              @if (loading()) {
                <app-skeleton type="table" [count]="8" [colCount]="7"/>
              } @else {
                @for (r of reports(); track r.id) {
                  <tr>
                    <td [attr.data-label]="isAr()?'الطالب':'Student'">
                      <div class="fw-medium" style="font-size:.85rem">{{ r.studentNameAr }}</div>
                    </td>
                    <td [attr.data-label]="isAr()?'الحضور':'Attendance'"><app-score-bar [val]="r.attendanceScore"/></td>
                    <td [attr.data-label]="isAr()?'الواجبات':'Assignments'"><app-score-bar [val]="r.assignmentScore"/></td>
                    <td [attr.data-label]="isAr()?'الاختبارات':'Quizzes'"><app-score-bar [val]="r.quizScore"/></td>
                    <td [attr.data-label]="isAr()?'المشاركة':'Participation'"><app-score-bar [val]="r.participationScore"/></td>
                    <td [attr.data-label]="isAr()?'الإجمالي':'Overall'">
                      <span class="fw-bold" [style.color]="scoreColor(r.overallScore)">
                        {{ r.overallScore | number:'1.0-1' }}%
                      </span>
                    </td>
                    <td [attr.data-label]="isAr()?'التقدير':'Grade'">
                      <span class="badge"
                        [class]="gradeClass(r.grade)">
                        {{ r.grade }}
                      </span>
                    </td>
                  </tr>
                }
                @if (!reports().length) {
                  <tr><td colspan="7" class="cell-empty text-center py-5 text-secondary">
                    <i class="bi bi-bar-chart-line d-block mb-2 fs-1 opacity-40"></i>
                    {{ isAr()?'لا توجد تقارير لهذا الشهر':'No reports for this period' }}
                  </td></tr>
                }
              }
            </tbody>
          </table>
        </div>
        <app-pagination [currentPage]="page()" [totalPages]="totalPages()"
          [totalCount]="total()" [pageSize]="20" (pageChange)="load($event)"/>
      </div>
    </div>
  `
})
export class AdminReportsComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly reports = signal<MonthlyReport[]>([]);
  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);

  selMonth = new Date().getMonth() + 1;
  selYear = new Date().getFullYear();

  avgScore = () => {
    const r = this.reports();
    return r.length ? r.reduce((s, x) => s + x.overallScore, 0) / r.length : 0;
  };

  readonly months = [
    { v: 1, ar: 'يناير', en: 'January' }, { v: 2, ar: 'فبراير', en: 'February' }, { v: 3, ar: 'مارس', en: 'March' },
    { v: 4, ar: 'أبريل', en: 'April' }, { v: 5, ar: 'مايو', en: 'May' }, { v: 6, ar: 'يونيو', en: 'June' },
    { v: 7, ar: 'يوليو', en: 'July' }, { v: 8, ar: 'أغسطس', en: 'August' }, { v: 9, ar: 'سبتمبر', en: 'September' },
    { v: 10, ar: 'أكتوبر', en: 'October' }, { v: 11, ar: 'نوفمبر', en: 'November' }, { v: 12, ar: 'ديسمبر', en: 'December' },
  ];
  readonly years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  ngOnInit() { this.load(1); }

  load(p: number) {
    this.loading.set(true); this.page.set(p);
    this.adminSvc.getReports(p, 20, this.selMonth, this.selYear).subscribe(r => {
      if (r.success && r.data) { this.reports.set(r.data.items); this.total.set(r.data.totalCount); this.totalPages.set(r.data.totalPages); }
      this.loading.set(false);
    });
  }

  exportExcel() {
    this.exporting.set(true);
    this.adminSvc.exportReport(this.selMonth, this.selYear).subscribe({
      next: blob => {
        this.exporting.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `report-${this.selYear}-${this.selMonth}.xlsx`; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.exporting.set(false); this.toast.error('خطأ', 'Error', 'فشل التصدير', 'Export failed'); }
    });
  }

  scoreColor(v: number) { return v >= 80 ? 'var(--lms-success)' : v >= 60 ? 'var(--lms-warning)' : 'var(--lms-danger)'; }
  gradeClass(g: string) {
    const m: Record<string, string> = { A: 'badge-active', B: 'badge-info', C: 'badge-warning', D: 'badge-warning', F: 'badge-live' };
    return m[g?.charAt(0)] ?? 'badge-inactive';
  }
}
