import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GroupService, SubscriptionService, AssignmentService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { Group, Subscription, Assignment } from '../../../core/models';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'مرحباً بك' : 'Welcome' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'نظرة عامة على تقدمك' : 'Your progress overview' }}</p>
        </div>
        <a routerLink="/subscribe" class="btn btn-primary">
          <i class="bi bi-plus-lg"></i> {{ isAr() ? 'اشتراك جديد' : 'New Subscription' }}
        </a>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon" style="background:#dbeafe"><i class="bi bi-collection text-primary fs-4"></i></div>
            <div><div class="stat-label">{{ isAr() ? 'مجموعاتي' : 'Groups' }}</div><div class="stat-value">{{ groups().length }}</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon" style="background:#fef3c7"><i class="bi bi-clipboard fs-4" style="color:#d97706"></i></div>
            <div><div class="stat-label">{{ isAr() ? 'واجبات معلقة' : 'Pending' }}</div><div class="stat-value">{{ pendingCount() }}</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon" style="background:#dcfce7"><i class="bi bi-credit-card fs-4" style="color:#16a34a"></i></div>
            <div><div class="stat-label">{{ isAr() ? 'اشتراكات' : 'Subs' }}</div><div class="stat-value">{{ subs().length }}</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon" style="background:#f3e8ff"><i class="bi bi-play-circle fs-4" style="color:#9333ea"></i></div>
            <div><div class="stat-label">{{ isAr() ? 'تسجيلات' : 'Recordings' }}</div><div class="stat-value">—</div></div>
          </div>
        </div>
      </div>

      <!-- Expiring subs -->
      @for (sub of expiringSoon(); track sub.id) {
        <div class="alert alert-warning d-flex align-items-center gap-3 mb-4">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div class="flex-grow-1">
            <strong>{{ isAr() ? 'اشتراكك على وشك الانتهاء' : 'Subscription Expiring Soon' }}</strong>
            <div style="font-size:.82rem">
              {{ isAr() ? sub.subjectNameAr : sub.subjectNameEn }} —
              {{ isAr() ? 'ينتهي في' : 'expires' }} {{ sub.endDate | date:'d MMM' }}
            </div>
          </div>
          <a routerLink="/subscribe" class="btn btn-sm btn-warning fw-semibold">{{ isAr() ? 'تجديد' : 'Renew' }}</a>
        </div>
      }

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-header py-3 d-flex align-items-center justify-content-between">
              <strong style="font-size:.9rem">{{ isAr() ? 'مجموعاتي' : 'My Groups' }}</strong>
              <a routerLink="/student/groups" class="btn btn-sm btn-link p-0" style="font-size:.8rem">{{ isAr() ? 'الكل' : 'All' }}</a>
            </div>
            <div class="card-body p-0">
              @if (loadingGroups()) { <div class="p-3"><app-skeleton type="list" [count]="3"/></div> }
              @else {
                @for (g of groups().slice(0,4); track g.id) {
                  <a [routerLink]="['/student/groups', g.id]"
                     class="d-flex align-items-center gap-3 px-4 py-3 border-bottom text-decoration-none"
                     style="border-color:var(--border-color)!important;color:inherit"
                     onmouseover="this.style.background='var(--surface-3)'" onmouseout="this.style.background=''">
                    <div class="group-icon">{{ (isAr() ? g.subjectNameAr : g.subjectNameEn).charAt(0) }}</div>
                    <div class="flex-grow-1">
                      <div class="fw-medium" style="font-size:.875rem">{{ isAr() ? g.subjectNameAr : g.subjectNameEn }}</div>
                      <div class="text-secondary" style="font-size:.75rem">{{ isAr() ? g.teacherNameAr : g.teacherNameEn }}</div>
                    </div>
                    <i class="bi bi-chevron-right text-secondary" [class.bi-chevron-left]="isAr()"></i>
                  </a>
                }
                @if (!groups().length) {
                  <div class="text-center py-5 text-secondary" style="font-size:.85rem">
                    <i class="bi bi-collection d-block mb-2 fs-3 opacity-50"></i>
                    <p class="mb-3">{{ isAr() ? 'لم تنضم لأي مجموعة' : 'No groups yet' }}</p>
                    <a routerLink="/subscribe" class="btn btn-primary btn-sm">{{ isAr() ? 'اشترك الآن' : 'Subscribe Now' }}</a>
                  </div>
                }
              }
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card">
            <div class="card-header py-3">
              <strong style="font-size:.9rem">{{ isAr() ? 'اشتراكاتي' : 'My Subscriptions' }}</strong>
            </div>
            <div class="card-body p-0">
              @for (sub of subs().slice(0,4); track sub.id) {
                <div class="d-flex align-items-center gap-3 px-4 py-3 border-bottom" style="border-color:var(--border-color)!important">
                  <div class="flex-grow-1">
                    <div class="fw-medium" style="font-size:.875rem">{{ isAr() ? sub.subjectNameAr : sub.subjectNameEn }}</div>
                    <div class="text-secondary" style="font-size:.75rem">{{ sub.endDate | date:'d MMM yyyy' }}</div>
                  </div>
                  <span class="badge"
                        [class]="sub.status==='Active' ? 'badge-active' : sub.status==='Expired' ? 'badge-danger' : 'badge-warning'">
                    {{ isAr() ? (sub.status==='Active' ? 'نشط' : sub.status==='Expired' ? 'منتهي' : sub.status) : sub.status }}
                  </span>
                </div>
              }
              @if (!subs().length) {
                <div class="text-center py-5 text-secondary" style="font-size:.85rem">
                  <i class="bi bi-credit-card d-block mb-2 fs-3 opacity-50"></i>
                  {{ isAr() ? 'لا توجد اشتراكات' : 'No subscriptions' }}
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  private readonly groupSvc  = inject(GroupService);
  private readonly subSvc    = inject(SubscriptionService);
  private readonly assignSvc = inject(AssignmentService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly groups        = signal<Group[]>([]);
  readonly subs          = signal<Subscription[]>([]);
  readonly loadingGroups = signal(true);
  /** Number of published assignments the student hasn't submitted yet. */
  readonly pendingCount  = signal(0);

  expiringSoon = () => this.subs().filter(s => {
    if (s.status !== 'Active') return false;
    return (new Date(s.endDate).getTime() - Date.now()) / 86400000 <= 7;
  });

  ngOnInit() {
    this.groupSvc.getMyGroups().subscribe(r => {
      if (r.success && r.data) {
        this.groups.set(r.data);
        this.loadPendingCount(r.data);
      }
      this.loadingGroups.set(false);
    });
    this.subSvc.getMySubscriptions().subscribe(r => {
      if (r.success && r.data) this.subs.set(r.data);
    });
  }

  /** Aggregates published assignments across all my groups and counts the ones I haven't submitted. */
  private loadPendingCount(groups: Group[]): void {
    if (groups.length === 0) { this.pendingCount.set(0); return; }
    const calls = groups.map(g => this.assignSvc.getGroupAssignments(g.id).pipe(
      map(r => r.success && r.data ? r.data : [] as Assignment[]),
      catchError(() => of([] as Assignment[]))
    ));
    forkJoin(calls).subscribe(per => {
      const pending = per.flat().filter(a => a.isPublished && !a.isSubmitted);
      this.pendingCount.set(pending.length);
    });
  }
}
