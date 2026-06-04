import { Routes } from '@angular/router';
import { authGuard, roleGuard, guestGuard } from './core/guards';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  // ── PUBLIC LAYOUT ────────────────────────────────────────────────
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      // Login pages
      {
        path: 'login/:role',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login.component').then(m => m.LoginComponent),
      },
      // Landing / subscribe / catalog
      {
        path: '',
        loadComponent: () =>
          import('./features/landing/home/landing.component').then(m => m.LandingComponent),
      },
      {
        path: 'subscribe',
        loadComponent: () =>
          import('./features/landing/subscribe/subscribe.component').then(m => m.SubscribeComponent),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/landing/catalog/catalog.component').then(m => m.CatalogComponent),
      },
      // Stripe return pages
      {
        path: 'payment/success',
        loadComponent: () =>
          import('./features/landing/payment-result/payment-result.component').then(m => m.PaymentResultComponent),
      },
      {
        path: 'payment/cancel',
        loadComponent: () =>
          import('./features/landing/payment-result/payment-result.component').then(m => m.PaymentResultComponent),
      },
    ]
  },

  // ── ADMIN DASHBOARD ──────────────────────────────────────────────
  {
    path: 'admin',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'teachers',
        loadComponent: () =>
          import('./features/admin/teachers/teachers.component').then(m => m.TeachersComponent),
      },
      {
        path: 'supervisors',
        loadComponent: () =>
          import('./features/admin/supervisors/supervisors.component').then(m => m.SupervisorsComponent),
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./features/admin/students/students.component').then(m => m.StudentsComponent),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./features/admin/groups/admin-groups.component').then(m => m.AdminGroupsComponent),
      },
      {
        path: 'subjects',
        loadComponent: () =>
          import('./features/admin/subjects/subjects.component').then(m => m.SubjectsComponent),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./features/admin/subscriptions/admin-subscriptions.component').then(m => m.AdminSubscriptionsComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/admin/payments/payments.component').then(m => m.PaymentsComponent),
      },
      {
        path: 'compensation',
        loadComponent: () =>
          import('./features/admin/compensation/compensation.component').then(m => m.CompensationComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/admin-reports.component').then(m => m.AdminReportsComponent),
      },
      {
        path: 'news',
        loadComponent: () =>
          import('./features/admin/news/news.component').then(m => m.NewsComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/admin/contact/contact.component').then(m => m.ContactComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/admin/support/support.component').then(m => m.SupportComponent),
      },
    ]
  },

  // ── SUPERVISOR DASHBOARD ─────────────────────────────────────────
  // All supervisor pages reuse the existing Admin components — backend
  // authorizes per-permission via the supervisor's grants, and the sidebar
  // hides routes the supervisor doesn't have access to.
  {
    path: 'supervisor',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Supervisor'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/supervisor/dashboard/supervisor-dashboard.component').then(m => m.SupervisorDashboardComponent),
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./features/admin/students/students.component').then(m => m.StudentsComponent),
      },
      {
        path: 'teachers',
        loadComponent: () =>
          import('./features/admin/teachers/teachers.component').then(m => m.TeachersComponent),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./features/admin/groups/admin-groups.component').then(m => m.AdminGroupsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/admin-reports.component').then(m => m.AdminReportsComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/admin/payments/payments.component').then(m => m.PaymentsComponent),
      },
      {
        path: 'news',
        loadComponent: () =>
          import('./features/admin/news/news.component').then(m => m.NewsComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/admin/contact/contact.component').then(m => m.ContactComponent),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/admin/support/support.component').then(m => m.SupportComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
    ]
  },

  // ── TEACHER DASHBOARD ────────────────────────────────────────────
  {
    path: 'teacher',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Teacher'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/teacher/dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./features/teacher/groups/teacher-groups.component').then(m => m.TeacherGroupsComponent),
      },
      {
        path: 'groups/:id',
        loadComponent: () =>
          import('./features/teacher/groups/group-detail/group-detail.component').then(m => m.GroupDetailComponent),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./features/teacher/sessions/sessions.component').then(m => m.SessionsComponent),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./features/teacher/assignments/assignments.component').then(m => m.TeacherAssignmentsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/teacher/reports/teacher-reports.component').then(m => m.TeacherReportsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
    ]
  },

  // ── STUDENT DASHBOARD ────────────────────────────────────────────
  {
    path: 'student',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Student'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/student/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./features/student/groups/student-groups.component').then(m => m.StudentGroupsComponent),
      },
      {
        path: 'groups/:id',
        loadComponent: () =>
          import('./features/student/groups/group-view/group-view.component').then(m => m.GroupViewComponent),
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./features/student/sessions/student-sessions.component').then(m => m.StudentSessionsComponent),
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./features/student/assignments/student-assignments.component').then(m => m.StudentAssignmentsComponent),
      },
      {
        path: 'assignments/:id/submit',
        loadComponent: () =>
          import('./features/student/assignments/submit/submit-assignment.component').then(m => m.SubmitAssignmentComponent),
      },
      {
        path: 'videos',
        loadComponent: () =>
          import('./features/student/videos/student-videos.component').then(m => m.StudentVideosComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/student/reports/student-reports.component').then(m => m.StudentReportsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/student/contact/student-contact.component').then(m => m.StudentContactComponent),
      },
    ]
  },

  // ── PARENT DASHBOARD ─────────────────────────────────────────────
  {
    path: 'parent',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Parent'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/parent/dashboard/parent-dashboard.component').then(m => m.ParentDashboardComponent),
      },
      {
        path: 'children',
        loadComponent: () =>
          import('./features/parent/children/children.component').then(m => m.ChildrenComponent),
      },
      {
        path: 'children/:id',
        loadComponent: () =>
          import('./features/parent/children/child-detail/child-detail.component').then(m => m.ChildDetailComponent),
      },
      {
        path: 'schedules',
        loadComponent: () =>
          import('./features/parent/schedules/schedules.component').then(m => m.SchedulesComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/parent/contact/parent-contact.component').then(m => m.ParentContactComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent),
      },
    ]
  },

  // ── FALLBACK ─────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];
