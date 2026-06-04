import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';
import { SupervisorPermissionsService } from '../../../core/services/supervisor-permissions.service';
import { AdminService } from '../../../core/services/api.services';
import { SupervisorPermissionType } from '../../../core/models';

interface PermissionCard {
  perm: SupervisorPermissionType;
  icon: string;
  ar: string;
  en: string;
  descAr: string;
  descEn: string;
  route?: string;            // Only set when the supervisor has a dedicated page for this permission
  color: string;
}

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-fade">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h1 class="section-title">
            {{ isAr() ? 'لوحة المشرف' : 'Supervisor Dashboard' }}
          </h1>
          <p class="section-subtitle">
            {{ isAr() ? 'مرحباً' : 'Welcome' }} {{ isAr() ? user()?.fullNameAr : user()?.fullNameEn }}
          </p>
        </div>
        <span class="badge bg-primary-subtle text-primary px-3 py-2" style="font-size:.82rem">
          <i class="bi bi-shield-check me-1"></i>
          {{ permissions().length }} / 9 {{ isAr() ? 'صلاحية' : 'permissions' }}
        </span>
      </div>

      <!-- Stats row — only fetched when the supervisor has the relevant permission -->
      <div class="row g-3 mb-4">
        @if (perms.has('ViewStudents')) {
          <div class="col-sm-6 col-lg-3">
            <div class="stat-card">
              <div class="stat-icon bg-primary-subtle text-primary"><i class="bi bi-mortarboard"></i></div>
              <div>
                <div class="stat-label">{{ isAr() ? 'الطلاب' : 'Students' }}</div>
                <div class="stat-value">{{ totalStudents() ?? '—' }}</div>
              </div>
            </div>
          </div>
        }
        @if (perms.has('ViewTeachers')) {
          <div class="col-sm-6 col-lg-3">
            <div class="stat-card">
              <div class="stat-icon bg-success-subtle text-success"><i class="bi bi-person-badge"></i></div>
              <div>
                <div class="stat-label">{{ isAr() ? 'المعلمون' : 'Teachers' }}</div>
                <div class="stat-value">{{ totalTeachers() ?? '—' }}</div>
              </div>
            </div>
          </div>
        }
        @if (perms.has('ViewGroups')) {
          <div class="col-sm-6 col-lg-3">
            <div class="stat-card">
              <div class="stat-icon bg-warning-subtle text-warning"><i class="bi bi-collection"></i></div>
              <div>
                <div class="stat-label">{{ isAr() ? 'المجموعات' : 'Groups' }}</div>
                <div class="stat-value">{{ totalGroups() ?? '—' }}</div>
              </div>
            </div>
          </div>
        }
        @if (!perms.hasAny()) {
          <div class="col-12">
            <div class="alert alert-warning d-flex align-items-center gap-2">
              <i class="bi bi-exclamation-triangle-fill"></i>
              {{ isAr()
                ? 'لم يتم منحك أي صلاحيات بعد. يرجى التواصل مع المدير لتفعيل صلاحياتك.'
                : 'You have no permissions yet. Please contact the admin to grant access.' }}
            </div>
          </div>
        }
      </div>

      <!-- Permission cards -->
      @if (perms.hasAny()) {
        <div class="card mb-4">
          <div class="card-header py-3">
            <strong style="font-size:.92rem">
              <i class="bi bi-grid me-2 text-primary"></i>
              {{ isAr() ? 'الصلاحيات المتاحة لك' : 'Your Available Permissions' }}
            </strong>
          </div>
          <div class="card-body">
            <div class="row g-3">
              @for (c of availableCards(); track c.perm) {
                <div class="col-sm-6 col-lg-4">
                  <a [routerLink]="c.route ? [c.route] : null"
                     class="permission-card text-decoration-none d-block p-3 rounded-3"
                     [style.cursor]="c.route ? 'pointer' : 'default'"
                     [class.disabled]="!c.route">
                    <div class="d-flex align-items-start gap-3">
                      <div class="permission-icon"
                           [style.background]="c.color + '20'"
                           [style.color]="c.color">
                        <i class="bi {{ c.icon }}"></i>
                      </div>
                      <div class="flex-grow-1 min-w-0">
                        <div class="fw-semibold mb-1" style="font-size:.9rem;color:var(--text-primary)">
                          {{ isAr() ? c.ar : c.en }}
                        </div>
                        <div class="text-secondary" style="font-size:.78rem;line-height:1.4">
                          {{ isAr() ? c.descAr : c.descEn }}
                        </div>
                      </div>
                      @if (c.route) {
                        <i class="bi bi-arrow-{{ isAr() ? 'left' : 'right' }} text-secondary"></i>
                      }
                    </div>
                  </a>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Locked permissions hint -->
      @if (lockedCards().length > 0 && perms.hasAny()) {
        <div class="card">
          <div class="card-header py-3">
            <strong style="font-size:.85rem;color:var(--text-secondary)">
              <i class="bi bi-lock me-2"></i>
              {{ isAr() ? 'صلاحيات غير ممنوحة' : 'Permissions Not Granted' }}
            </strong>
          </div>
          <div class="card-body py-2">
            <div class="d-flex flex-wrap gap-2">
              @for (c of lockedCards(); track c.perm) {
                <span class="badge bg-light text-secondary border" style="font-size:.72rem;padding:6px 10px">
                  <i class="bi {{ c.icon }} me-1"></i>
                  {{ isAr() ? c.ar : c.en }}
                </span>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .permission-card {
      background: var(--surface);
      border: 1px solid var(--border-color);
      transition: all .2s ease;
    }
    .permission-card:not(.disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,.08);
      border-color: var(--lms-primary);
    }
    .permission-card.disabled { opacity: .6; pointer-events: none; }
    .permission-icon {
      width: 44px; height: 44px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; flex-shrink: 0;
    }
  `]
})
export class SupervisorDashboardComponent implements OnInit {
  private readonly lang     = inject(LanguageService);
  private readonly auth     = inject(AuthService);
  readonly perms            = inject(SupervisorPermissionsService);
  private readonly adminSvc = inject(AdminService);

  readonly isAr = this.lang.isRtl;
  readonly user = this.auth.currentUser$;
  readonly permissions = this.perms.permissions;

  readonly totalStudents = signal<number | null>(null);
  readonly totalTeachers = signal<number | null>(null);
  readonly totalGroups   = signal<number | null>(null);

  // Permission → card metadata (shared with sidebar).
  // Cards with a `route` are clickable shortcuts to the corresponding page.
  private readonly CARDS: PermissionCard[] = [
    { perm: 'ViewStudents',                  icon: 'bi-mortarboard',     ar: 'عرض الطلاب',          en: 'View Students',          descAr: 'تصفح قائمة الطلاب والاطلاع على بياناتهم',                       descEn: 'Browse students list and view details',                  route: '/supervisor/students',   color: '#4f46e5' },
    { perm: 'ViewStudentReports',            icon: 'bi-graph-up',         ar: 'تقارير الطلاب',       en: 'Student Reports',        descAr: 'الاطلاع على التقارير الشهرية للطلاب',                          descEn: 'View monthly student performance reports',               route: '/supervisor/reports',    color: '#7c3aed' },
    { perm: 'ViewAttendance',                icon: 'bi-calendar-check',   ar: 'الحضور',              en: 'Attendance',             descAr: 'مراجعة سجلات حضور الطلاب في الحصص',                              descEn: 'Review student attendance per session',                  route: '/supervisor/attendance', color: '#0891b2' },
    { perm: 'ViewTeachers',                  icon: 'bi-person-badge',     ar: 'عرض المعلمين',        en: 'View Teachers',          descAr: 'الاطلاع على بيانات المعلمين وتقييماتهم',                         descEn: 'Browse teachers list and ratings',                       route: '/supervisor/teachers',   color: '#16a34a' },
    { perm: 'ViewGroups',                    icon: 'bi-collection',       ar: 'عرض المجموعات',       en: 'View Groups',            descAr: 'استعراض المجموعات والأعضاء والحصص',                              descEn: 'Browse groups, members and sessions',                    route: '/supervisor/groups',     color: '#d97706' },
    { perm: 'ManageContent',                 icon: 'bi-newspaper',         ar: 'إدارة المحتوى',       en: 'Manage Content',         descAr: 'إضافة وتعديل الأخبار والمواد التعليمية',                         descEn: 'Add and edit news and educational content',              route: '/supervisor/news',       color: '#dc2626' },
    { perm: 'ViewPayments',                  icon: 'bi-cash-stack',       ar: 'عرض المدفوعات',       en: 'View Payments',          descAr: 'مراجعة المدفوعات وتقارير الاشتراكات',                            descEn: 'Review payments and subscriptions',                       route: '/supervisor/payments',   color: '#059669' },
    { perm: 'ReplyContactMessages',          icon: 'bi-envelope',         ar: 'الرد على الرسائل',    en: 'Reply Messages',         descAr: 'الاطلاع على رسائل التواصل والرد عليها',                          descEn: 'Read contact messages and reply',                        route: '/supervisor/contact',    color: '#0284c7' },
    { perm: 'AddRemoveStudentsFromGroups',   icon: 'bi-person-plus',      ar: 'إدارة عضوية المجموعات', en: 'Group Membership',     descAr: 'إضافة أو إزالة طلاب من المجموعات',                                descEn: 'Add or remove students from groups',                     route: '/supervisor/groups',     color: '#be185d' },
  ];

  availableCards = () => this.CARDS.filter(c => this.perms.has(c.perm));
  lockedCards    = () => this.CARDS.filter(c => !this.perms.has(c.perm));

  ngOnInit(): void {
    // Refresh permissions from /auth/me in case the admin updated them
    // while the supervisor was already logged in.
    this.perms.reload();

    // Fetch stats only for the permissions the supervisor actually has
    if (this.perms.has('ViewStudents')) {
      this.adminSvc.getStudents(1, 1).subscribe(r => {
        if (r.success && r.data) this.totalStudents.set(r.data.totalCount);
      });
    }
    if (this.perms.has('ViewTeachers')) {
      this.adminSvc.getTeachers(1, 1).subscribe(r => {
        if (r.success && r.data) this.totalTeachers.set(r.data.totalCount);
      });
    }
    if (this.perms.has('ViewGroups')) {
      this.adminSvc.getAllGroups(1, 1).subscribe(r => {
        if (r.success && r.data) this.totalGroups.set(r.data.totalCount);
      });
    }
  }
}
