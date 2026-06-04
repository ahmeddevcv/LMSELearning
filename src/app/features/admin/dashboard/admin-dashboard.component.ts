import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { DashboardStats } from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="page-fade">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'لوحة التحكم' : 'Dashboard' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'نظرة عامة على المنصة' : 'Platform overview' }}</p>
        </div>
        <small class="text-secondary">{{ today() }}</small>
      </div>

      <!-- Stats -->
      <div class="row g-3 mb-4 anim-stagger">
        @if (loading()) {
          @for (i of [1,2,3,4]; track i) {
            <div class="col-6 col-xl-3"><app-skeleton type="stat"/></div>
          }
        } @else if (stats()) {
          <div class="col-6 col-xl-3">
            <div class="stat-card">
              <div class="stat-icon stat-icon-info"><i class="bi bi-mortarboard fs-4"></i></div>
              <div>
                <div class="stat-label">{{ isAr() ? 'الطلاب' : 'Students' }}</div>
                <div class="stat-value">{{ stats()!.totalStudents | number }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-xl-3">
            <div class="stat-card">
              <div class="stat-icon stat-icon-primary"><i class="bi bi-person-badge fs-4"></i></div>
              <div>
                <div class="stat-label">{{ isAr() ? 'المعلمون' : 'Teachers' }}</div>
                <div class="stat-value">{{ stats()!.totalTeachers | number }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-xl-3">
            <div class="stat-card">
              <div class="stat-icon stat-icon-success"><i class="bi bi-collection fs-4"></i></div>
              <div>
                <div class="stat-label">{{ isAr() ? 'المجموعات' : 'Groups' }}</div>
                <div class="stat-value">{{ stats()!.totalGroups | number }}</div>
              </div>
            </div>
          </div>
          <div class="col-6 col-xl-3">
            <div class="stat-card">
              <div class="stat-icon stat-icon-warning"><i class="bi bi-cash-stack fs-4"></i></div>
              <div>
                <div class="stat-label">{{ isAr() ? 'الإيراد الشهري' : 'Monthly Revenue' }}</div>
                <div class="stat-value">{{ (stats()!.monthRevenue ?? 0) | number }} <span style="font-size:.7rem;font-weight:500;color:var(--text-muted)">EGP</span></div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Pending compensations alert -->
      @if (stats() && (stats()!.pendingCompensations ?? 0) > 0) {
        <div class="alert alert-warning d-flex align-items-center gap-3 mb-4">
          <i class="bi bi-exclamation-triangle-fill fs-5"></i>
          <div class="flex-grow-1">
            <strong>{{ isAr() ? 'مكافآت معلمين معلقة' : 'Pending Teacher Compensations' }}</strong>
            <div style="font-size:.85rem">
              {{ stats()!.pendingCompensations }}
              {{ isAr() ? ' مكافأة لم تُدفع' : ' compensations not yet paid' }}
            </div>
          </div>
          <a routerLink="/admin/compensation" class="btn btn-sm btn-warning fw-semibold">
            {{ isAr() ? 'عرض' : 'View' }}
          </a>
        </div>
      }

      <!-- Quick Actions + Recent Payments -->
      <div class="row g-4 mb-4">
        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header py-3">
              <strong style="font-size:.9rem">{{ isAr() ? 'إجراءات سريعة' : 'Quick Actions' }}</strong>
            </div>
            <div class="card-body">
              <div class="row g-3 anim-stagger">
                @for (a of quickActions; track a.route) {
                  <div class="col-6">
                    <a [routerLink]="a.route" class="quick-action-tile w-100">
                      <span class="fs-5">{{ a.icon }}</span>
                      <span>{{ isAr() ? a.ar : a.en }}</span>
                    </a>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header py-3 d-flex align-items-center justify-content-between">
              <strong style="font-size:.9rem">{{ isAr() ? 'أحدث المدفوعات' : 'Recent Payments' }}</strong>
            </div>
            <div class="card-body p-0">
              @if (loading()) {
                <div class="p-3"><app-skeleton type="list" [count]="4"/></div>
              } @else {
                @for (p of stats()?.recentPayments ?? []; track p.date) {
                  <div class="d-flex align-items-center justify-content-between px-4 py-3 border-bottom" style="border-color:var(--border-color)!important">
                    <div>
                      <div style="font-size:.875rem;font-weight:500">{{ p.studentName }}</div>
                      <div style="font-size:.75rem;color:var(--text-muted)">{{ p.date | date:'d MMM' }}</div>
                    </div>
                    <span class="fw-semibold" style="color:var(--lms-success)">+{{ p.amount }} EGP</span>
                  </div>
                }
                @if (!(stats()?.recentPayments?.length)) {
                  <div class="text-center py-5 text-secondary" style="font-size:.85rem">
                    {{ isAr() ? 'لا توجد مدفوعات حديثة' : 'No recent payments' }}
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue bar chart (pure CSS) -->
      <div class="card">
        <div class="card-header py-3">
          <strong style="font-size:.9rem">{{ isAr() ? 'الإيرادات الشهرية' : 'Monthly Revenue' }}</strong>
        </div>
        <div class="card-body">
          @if (loading()) {
            <div style="height:160px" class="d-flex align-items-end gap-2">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="flex-fill skeleton" [style.height.%]="(i*15)+20"></div>
              }
            </div>
          } @else {
            <div class="d-flex align-items-end gap-2" style="height:160px">
              @for (b of stats()?.revenueByMonth ?? []; track b.month) {
                <div class="flex-fill d-flex flex-column align-items-center gap-1">
                  <div class="w-100 rounded-top bar-grow"
                       style="background:linear-gradient(180deg, var(--lms-primary) 0%, var(--lms-primary-dark) 100%);opacity:.9;cursor:default"
                       [style.height.%]="barH(b.amount)"
                       [title]="b.amount + ' EGP'"></div>
                  <small style="font-size:.65rem;color:var(--text-muted);writing-mode:vertical-lr;transform:rotate(180deg)">{{ b.month }}</small>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly loading = signal(true);
  readonly stats   = signal<DashboardStats | null>(null);

  readonly quickActions = [
    { ar:'إضافة معلم',  en:'Add Teacher',  icon:'👨‍🏫', route:'/admin/teachers' },
    { ar:'إضافة طالب',  en:'Add Student',  icon:'🎓',  route:'/admin/students' },
    { ar:'منح اشتراك',  en:'Grant Sub',    icon:'🎁',  route:'/admin/students' },
    { ar:'تقرير شهري',  en:'Monthly Report',icon:'📋', route:'/admin/reports'  },
  ];

  today = () => new Date().toLocaleDateString(this.isAr() ? 'ar-EG' : 'en-US', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });

  ngOnInit() {
    this.adminSvc.getDashboard().subscribe({
      next: r => { if (r.success && r.data) this.stats.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  barH(amount: number): number {
    const max = Math.max(...(this.stats()?.revenueByMonth?.map(b => b.amount) ?? [1]), 1);
    return (amount / max) * 100;
  }
}
