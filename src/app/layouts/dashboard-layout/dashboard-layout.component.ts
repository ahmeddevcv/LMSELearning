import {
  Component, inject, signal, computed, OnInit, OnDestroy, HostListener
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { StorageService } from '../../core/services/storage.service';
import { SignalRService } from '../../core/services/signalr.service';
import { NotificationApiService } from '../../core/services/api.services';
import { PlatformSettingsService } from '../../core/services/platform-settings.service';
import { ToastContainerComponent } from '../../shared/components/toast/toast-container.component';
import { UserRole, Notification, SupervisorPermissionType } from '../../core/models';
import { Router } from '@angular/router';
import { SupervisorPermissionsService } from '../../core/services/supervisor-permissions.service';
import { mediaUrl } from '../../core/utils/media';

interface NavItem {
  labelAr: string; labelEn: string;
  icon: string; route: string;
  roles: UserRole[];
  /** Optional supervisor permission required to see this item (Supervisor only) */
  permission?: SupervisorPermissionType;
}

const NAV: NavItem[] = [
  // Admin
  { labelAr:'لوحة التحكم', labelEn:'Dashboard',   icon:'bi-speedometer2',     route:'/admin/dashboard',     roles:['Admin'] },
  { labelAr:'المعلمون',    labelEn:'Teachers',     icon:'bi-person-badge',     route:'/admin/teachers',      roles:['Admin'] },
  { labelAr:'المشرفون',    labelEn:'Supervisors',  icon:'bi-people',           route:'/admin/supervisors',   roles:['Admin'] },
  { labelAr:'الطلاب',      labelEn:'Students',     icon:'bi-mortarboard',      route:'/admin/students',      roles:['Admin'] },
  { labelAr:'المجموعات',   labelEn:'Groups',       icon:'bi-collection',       route:'/admin/groups',        roles:['Admin'] },
  { labelAr:'المواد',      labelEn:'Subjects',     icon:'bi-book',             route:'/admin/subjects',      roles:['Admin'] },
  { labelAr:'الاشتراكات',  labelEn:'Subscriptions',icon:'bi-credit-card',      route:'/admin/subscriptions', roles:['Admin'] },
  { labelAr:'المدفوعات',   labelEn:'Payments',     icon:'bi-cash-stack',       route:'/admin/payments',      roles:['Admin'] },
  { labelAr:'المكافآت',    labelEn:'Compensation', icon:'bi-wallet2',          route:'/admin/compensation',  roles:['Admin'] },
  { labelAr:'التقارير',    labelEn:'Reports',      icon:'bi-bar-chart-line',   route:'/admin/reports',       roles:['Admin'] },
  { labelAr:'الأخبار',     labelEn:'News',         icon:'bi-newspaper',        route:'/admin/news',          roles:['Admin'] },
  { labelAr:'الرسائل',     labelEn:'Messages',     icon:'bi-envelope',         route:'/admin/contact',       roles:['Admin'] },
  { labelAr:'الإعدادات',   labelEn:'Settings',     icon:'bi-gear',             route:'/admin/settings',      roles:['Admin'] },
  { labelAr:'الملف الشخصي',labelEn:'Profile',      icon:'bi-person-circle',    route:'/admin/profile',       roles:['Admin'] },
  // Supervisor — dashboard is always visible; sub-pages gated by permissions
  { labelAr:'لوحة التحكم', labelEn:'Dashboard',   icon:'bi-speedometer2',     route:'/supervisor/dashboard',roles:['Supervisor'] },
  { labelAr:'الطلاب',      labelEn:'Students',     icon:'bi-mortarboard',      route:'/supervisor/students', roles:['Supervisor'], permission:'ViewStudents' },
  { labelAr:'المعلمون',    labelEn:'Teachers',     icon:'bi-person-badge',     route:'/supervisor/teachers', roles:['Supervisor'], permission:'ViewTeachers' },
  { labelAr:'المجموعات',   labelEn:'Groups',       icon:'bi-collection',       route:'/supervisor/groups',   roles:['Supervisor'], permission:'ViewGroups' },
  { labelAr:'التقارير',    labelEn:'Reports',      icon:'bi-bar-chart-line',   route:'/supervisor/reports',  roles:['Supervisor'], permission:'ViewStudentReports' },
  { labelAr:'المدفوعات',   labelEn:'Payments',     icon:'bi-cash-stack',       route:'/supervisor/payments', roles:['Supervisor'], permission:'ViewPayments' },
  { labelAr:'الأخبار',     labelEn:'News',         icon:'bi-newspaper',        route:'/supervisor/news',     roles:['Supervisor'], permission:'ManageContent' },
  { labelAr:'الرسائل',     labelEn:'Messages',     icon:'bi-envelope',         route:'/supervisor/contact',  roles:['Supervisor'], permission:'ReplyContactMessages' },
  { labelAr:'الملف الشخصي',labelEn:'Profile',      icon:'bi-person-circle',    route:'/supervisor/profile',  roles:['Supervisor'] },
  // Teacher
  { labelAr:'الرئيسية',    labelEn:'Dashboard',   icon:'bi-house',            route:'/teacher/dashboard',   roles:['Teacher'] },
  { labelAr:'مجموعاتي',    labelEn:'My Groups',   icon:'bi-collection',       route:'/teacher/groups',      roles:['Teacher'] },
  { labelAr:'الحصص',       labelEn:'Sessions',    icon:'bi-camera-video',     route:'/teacher/sessions',    roles:['Teacher'] },
  { labelAr:'الواجبات',    labelEn:'Assignments', icon:'bi-clipboard-check',  route:'/teacher/assignments', roles:['Teacher'] },
  { labelAr:'التقارير',    labelEn:'Reports',     icon:'bi-graph-up',         route:'/teacher/reports',     roles:['Teacher'] },
  { labelAr:'الملف الشخصي',labelEn:'Profile',     icon:'bi-person-circle',    route:'/teacher/profile',     roles:['Teacher'] },
  // Student
  { labelAr:'الرئيسية',    labelEn:'Dashboard',   icon:'bi-house',            route:'/student/dashboard',   roles:['Student'] },
  { labelAr:'مجموعاتي',    labelEn:'My Groups',   icon:'bi-collection',       route:'/student/groups',      roles:['Student'] },
  { labelAr:'الحصص',       labelEn:'Sessions',    icon:'bi-camera-video',     route:'/student/sessions',    roles:['Student'] },
  { labelAr:'الواجبات',    labelEn:'Assignments', icon:'bi-clipboard-check',  route:'/student/assignments', roles:['Student'] },
  { labelAr:'التسجيلات',   labelEn:'Recordings',  icon:'bi-play-circle',      route:'/student/videos',      roles:['Student'] },
  { labelAr:'تقاريري',     labelEn:'My Reports',  icon:'bi-graph-up',         route:'/student/reports',     roles:['Student'] },
  { labelAr:'الملف الشخصي',labelEn:'Profile',     icon:'bi-person-circle',    route:'/student/profile',     roles:['Student'] },
  // Parent
  { labelAr:'الرئيسية',    labelEn:'Dashboard',   icon:'bi-house',            route:'/parent/dashboard',    roles:['Parent'] },
  { labelAr:'أبنائي',      labelEn:'My Children', icon:'bi-people-fill',      route:'/parent/children',     roles:['Parent'] },
  { labelAr:'المواعيد',    labelEn:'Schedules',   icon:'bi-calendar3',        route:'/parent/schedules',    roles:['Parent'] },
  { labelAr:'الملف الشخصي',labelEn:'Profile',     icon:'bi-person-circle',    route:'/parent/profile',      roles:['Parent'] },
];

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastContainerComponent],
  template: `
    <div class="lms-wrapper">

      <!-- Sidebar overlay (mobile) -->
      <div class="sidebar-overlay" [class.show]="mobileOpen()" (click)="closeMobile()"></div>

      <!-- ═══ SIDEBAR ═══ -->
      <aside class="lms-sidebar"
             [class.collapsed]="collapsed()"
             [class.mobile-open]="mobileOpen()">

        <!-- Brand -->
        <a routerLink="/" class="sidebar-brand">
          <div class="brand-icon">{{ brandInitial() }}</div>
          <span class="brand-text">{{ platformName() }}</span>
        </a>

        <!-- Nav -->
        <nav class="sidebar-nav">
          @for (item of visibleNav(); track item.route) {
            <a [routerLink]="item.route"
               routerLinkActive="active"
               class="sidebar-nav-item"
               [title]="collapsed() ? (isAr() ? item.labelAr : item.labelEn) : ''"
               (click)="closeMobile()">
              <i class="bi {{ item.icon }}"></i>
              <span class="nav-item-text">{{ isAr() ? item.labelAr : item.labelEn }}</span>
            </a>
          }
        </nav>

        <!-- User -->
        <div class="sidebar-user">
          <div class="user-avatar">
            @if (avatarUrl(); as src) {
              <img [src]="src" [alt]="user()?.fullNameAr ?? ''">
            } @else {
              {{ user()?.fullNameAr?.charAt(0) ?? '?' }}
            }
          </div>
          <div class="flex-grow-1 overflow-hidden">
            <div class="user-name">{{ isAr() ? user()?.fullNameAr : user()?.fullNameEn }}</div>
            <div class="user-role">{{ roleLabel() }}</div>
          </div>
          <button class="btn btn-sm btn-link p-1 text-secondary" (click)="logout()" title="خروج">
            <i class="bi bi-box-arrow-right fs-6"></i>
          </button>
        </div>
      </aside>

      <!-- ═══ MAIN ═══ -->
      <div class="lms-main" [class.sidebar-collapsed]="collapsed()">

        <!-- Header -->
        <header class="lms-header">
          <!-- Toggle -->
          <button class="btn btn-sm btn-link p-1 text-secondary d-none d-md-inline-flex"
                  (click)="toggleCollapse()">
            <i class="bi bi-layout-sidebar fs-5"></i>
          </button>
          <button class="btn btn-sm btn-link p-1 text-secondary d-md-none"
                  (click)="toggleMobile()">
            <i class="bi bi-list fs-5"></i>
          </button>

          <div class="flex-grow-1"></div>

          <!-- Lang -->
          <button class="btn btn-sm btn-outline-secondary fw-semibold"
                  style="min-width:42px" (click)="lang.toggle()">
            {{ isAr() ? 'EN' : 'ع' }}
          </button>

          <!-- Dark mode -->
          <button class="btn btn-sm btn-outline-secondary" (click)="toggleDark()">
            <i class="bi" [class]="dark() ? 'bi-sun' : 'bi-moon'"></i>
          </button>

          <!-- Notifications -->
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary position-relative"
                    data-bs-toggle="dropdown"
                    (click)="loadNotifications()">
              <i class="bi bi-bell"></i>
              @if (unread() > 0) {
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style="font-size:.6rem">
                  {{ unread() > 9 ? '9+' : unread() }}
                </span>
              }
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow" style="min-width:320px;max-width:380px;max-height:480px;overflow-y:auto">
              <li class="px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                <strong style="font-size:.875rem">{{ isAr() ? 'الإشعارات' : 'Notifications' }}</strong>
                @if (unread() > 0) {
                  <button class="btn btn-sm btn-link p-0" style="font-size:.75rem" (click)="markAllRead($event)">
                    {{ isAr() ? 'تعليم الكل كمقروء' : 'Mark all read' }}
                  </button>
                }
              </li>
              @if (loadingNotifs()) {
                <li class="text-center py-3 text-secondary" style="font-size:.8rem">
                  <span class="spinner-border spinner-border-sm me-2"></span>{{ isAr() ? 'جاري التحميل...' : 'Loading...' }}
                </li>
              } @else if (notifications().length === 0) {
                <li>
                  <div class="text-center py-4 text-secondary" style="font-size:.8rem">
                    <i class="bi bi-bell-slash d-block mb-1 fs-5"></i>
                    {{ isAr() ? 'لا توجد إشعارات' : 'No notifications' }}
                  </div>
                </li>
              } @else {
                @for (n of notifications(); track n.id) {
                  <li class="border-bottom" [style.background]="n.isRead ? 'transparent' : 'var(--lms-primary-light, #eef2ff)'">
                    <a class="dropdown-item d-flex flex-column align-items-start py-2 px-3"
                       style="white-space:normal;cursor:pointer"
                       (click)="onNotifClick(n, $event)">
                      <strong style="font-size:.82rem;line-height:1.2">{{ isAr() ? n.titleAr : n.titleEn }}</strong>
                      <small class="text-secondary mt-1" style="font-size:.72rem;line-height:1.4">
                        {{ isAr() ? n.messageAr : n.messageEn }}
                      </small>
                      <small class="text-muted mt-1" style="font-size:.68rem">
                        {{ n.createdAt | date:'d MMM, h:mm a' }}
                      </small>
                    </a>
                  </li>
                }
              }
            </ul>
          </div>
        </header>

        <!-- Page content -->
        <main class="lms-content">
          <router-outlet/>
        </main>
      </div>
    </div>
    <app-toast-container/>
  `
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private readonly auth     = inject(AuthService);
  readonly lang             = inject(LanguageService);
  private readonly storage  = inject(StorageService);
  private readonly signalr  = inject(SignalRService);
  private readonly notifApi = inject(NotificationApiService);
  private readonly platform = inject(PlatformSettingsService);
  private readonly supPerms = inject(SupervisorPermissionsService);

  readonly user          = this.auth.currentUser$;
  readonly isAr          = this.lang.isRtl;
  readonly platformName  = this.platform.name;
  readonly brandInitial  = computed(() => this.platformName().charAt(0) || 'L');
  readonly avatarUrl     = computed(() => mediaUrl(this.user()?.profileImageUrl));
  readonly collapsed = signal(this.storage.getSidebarCollapsed());
  readonly mobileOpen= signal(false);
  readonly dark      = signal(this.storage.getDarkMode());
  readonly unread    = signal(0);
  readonly notifications  = signal<Notification[]>([]);
  readonly loadingNotifs  = signal(false);
  private readonly router = inject(Router);

  private subs: Subscription[] = [];

  readonly roleLabel = computed(() => {
    const m: Record<string, string> = {
      Admin:'مدير', Supervisor:'مشرف', Teacher:'معلم', Student:'طالب', Parent:'ولي أمر'
    };
    return m[this.user()?.role ?? ''] ?? '';
  });

  readonly visibleNav = computed(() => {
    const role = this.user()?.role;
    if (!role) return NAV;
    // For supervisors, also gate items behind their granted permissions.
    // (The `permission` field is undefined for items without a perm requirement,
    // e.g. the supervisor dashboard itself — those stay visible.)
    return NAV.filter(n => {
      if (!n.roles.includes(role)) return false;
      if (role === 'Supervisor' && n.permission) return this.supPerms.has(n.permission);
      return true;
    });
  });

  @HostListener('window:resize')
  onResize() { if (window.innerWidth >= 768) this.mobileOpen.set(false); }

  async ngOnInit(): Promise<void> {
    if (this.dark()) document.documentElement.setAttribute('data-theme', 'dark');
    // Refresh supervisor permissions on every dashboard mount so the sidebar
    // reflects the latest grants (admin may have changed them recently).
    if (this.user()?.role === 'Supervisor') this.supPerms.reload();
    await this.signalr.connectNotifications();
    this.notifApi.getUnreadCount().subscribe(r => {
      if (r.success && r.data != null) this.unread.set(r.data);
    });
    this.subs.push(this.signalr.notification$.subscribe(() => this.unread.update(n => n + 1)));
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }

  toggleCollapse() {
    this.collapsed.update(v => !v);
    this.storage.setSidebarCollapsed(this.collapsed());
  }
  toggleMobile()  { this.mobileOpen.update(v => !v); }
  closeMobile()   { this.mobileOpen.set(false); }

  toggleDark() {
    this.dark.update(v => !v);
    document.documentElement.setAttribute('data-theme', this.dark() ? 'dark' : '');
    this.storage.setDarkMode(this.dark());
  }

  logout() { this.auth.logout(); }

  loadNotifications() {
    this.loadingNotifs.set(true);
    this.notifApi.getAll(1, 10).subscribe({
      next: r => {
        if (r.success && r.data) this.notifications.set(r.data.items);
        this.loadingNotifs.set(false);
      },
      error: () => this.loadingNotifs.set(false)
    });
  }

  onNotifClick(n: Notification, ev: Event) {
    ev.preventDefault();
    if (!n.isRead) {
      this.notifApi.markRead(n.id).subscribe(r => {
        if (r.success) {
          this.notifications.update(ns => ns.map(x => x.id === n.id ? { ...x, isRead: true } : x));
          this.unread.update(c => Math.max(0, c - 1));
        }
      });
    }

    // Deep-link by notification Type → the exact page+state the user expects to land on.
    // Backend sets `type` to the NotificationType enum string + `referenceId` for entity-bound notifs.
    const role = this.user()?.role;
    const t = n.type;
    const ref = n.referenceId;

    // Contact messages (Admin/Supervisor)
    if (n.referenceType === 'ContactMessage') { this.router.navigate(['/admin/contact']); return; }

    // Session notifications → student sessions page with the right filter
    if (t === 'SessionScheduled')                { this.router.navigate(['/student/sessions'], { queryParams: { filter: 'upcoming' } }); return; }
    if (t === 'SessionReminder15Min')            { this.router.navigate(['/student/sessions'], { queryParams: { filter: 'upcoming' } }); return; }
    if (t === 'SessionStarted')                  { this.router.navigate(['/student/sessions'], { queryParams: { filter: 'live' } }); return; }
    if (t === 'SessionEnded' || t === 'RecordingAvailable') {
      this.router.navigate(['/student/sessions'], { queryParams: { filter: 'completed' } }); return;
    }

    // Assignment notifications
    if (t === 'AssignmentCreated' || t === 'ExamCreated' || t === 'AssignmentResult' || t === 'AssignmentDeadlineReminder24h') {
      if (role === 'Teacher') { this.router.navigate(['/teacher/assignments']); return; }
      if (ref) { this.router.navigate(['/student/assignments', ref, 'submit']); return; }
      this.router.navigate(['/student/assignments']); return;
    }
    if (t === 'AssignmentSubmitted') { this.router.navigate(['/teacher/assignments']); return; }

    // Group welcome / general
    if (n.referenceType === 'Group' && ref && role === 'Student') {
      this.router.navigate(['/student/groups', ref]); return;
    }
  }

  markAllRead(ev: Event) {
    ev.preventDefault(); ev.stopPropagation();
    this.notifApi.markAllRead().subscribe(r => {
      if (r.success) {
        this.notifications.update(ns => ns.map(x => ({ ...x, isRead: true })));
        this.unread.set(0);
      }
    });
  }
}
