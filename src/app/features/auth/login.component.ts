import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { UserRole } from '../../core/models';

const ROLES: Record<string, { ar: string; en: string; icon: string }> = {
  admin:      { ar: 'المدير',    en: 'Admin',      icon: 'bi-shield-lock' },
  supervisor: { ar: 'المشرف',   en: 'Supervisor',  icon: 'bi-eye' },
  teacher:    { ar: 'المعلم',    en: 'Teacher',     icon: 'bi-person-badge' },
  student:    { ar: 'الطالب',   en: 'Student',     icon: 'bi-mortarboard' },
  parent:     { ar: 'ولي الأمر', en: 'Parent',     icon: 'bi-people-fill' },
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div style="width:100%;max-width:440px">
      <!-- Card -->
      <div class="p-4 p-md-5 rounded-4"
           style="background:rgba(255,255,255,.1);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.2)">

        <!-- Role icon + title -->
        <div class="text-center mb-4">
          <div class="d-inline-flex align-items-center justify-content-center mb-3"
               style="width:64px;height:64px;background:rgba(255,255,255,.15);border-radius:18px">
            <i class="bi {{ cfg()?.icon }} text-white fs-3"></i>
          </div>
          <h4 class="fw-bold text-white mb-1">{{ isAr() ? 'مرحباً بك' : 'Welcome Back' }}</h4>
          <p class="mb-0" style="color:rgba(255,255,255,.6);font-size:.875rem">
            {{ isAr() ? 'دخول ' + cfg()?.ar : cfg()?.en + ' Login' }}
          </p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <!-- Email -->
          <div class="mb-3">
            <label class="form-label fw-medium" style="color:rgba(255,255,255,.8)">
              {{ isAr() ? 'البريد الإلكتروني' : 'Email' }}
            </label>
            <input type="email" formControlName="email"
                   class="form-control"
                   style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);color:#fff"
                   [placeholder]="roleParam() + '@lms.com'">
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <div class="text-warning mt-1" style="font-size:.78rem">
                {{ isAr() ? 'البريد الإلكتروني مطلوب' : 'Email is required' }}
              </div>
            }
          </div>

          <!-- Password -->
          <div class="mb-3">
            <label class="form-label fw-medium" style="color:rgba(255,255,255,.8)">
              {{ isAr() ? 'كلمة المرور' : 'Password' }}
            </label>
            <div class="input-group">
              <input [type]="showPwd() ? 'text' : 'password'"
                     formControlName="password"
                     class="form-control"
                     style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);color:#fff"
                     placeholder="••••••••">
              <button type="button" class="btn"
                      style="background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.25);color:#fff"
                      (click)="showPwd.set(!showPwd())">
                <i class="bi" [class]="showPwd() ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <div class="text-warning mt-1" style="font-size:.78rem">
                {{ isAr() ? 'كلمة المرور مطلوبة' : 'Password is required' }}
              </div>
            }
          </div>

          <!-- Error -->
          @if (err()) {
            <div class="alert alert-danger border-0 rounded-3 py-2 mb-3"
                 style="background:rgba(239,68,68,.2);color:#fca5a5;font-size:.85rem">
              <i class="bi bi-exclamation-circle me-2"></i>{{ err() }}
            </div>
          }

          <!-- Submit -->
          <button type="submit" class="btn btn-light w-100 fw-semibold py-2"
                  [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2"></span>
            }
            {{ isAr() ? 'دخول' : 'Sign In' }}
          </button>
        </form>

        <!-- Subscribe link (students only) -->
        @if (roleParam() === 'student') {
          <div class="text-center mt-3" style="font-size:.85rem;color:rgba(255,255,255,.5)">
            {{ isAr() ? 'ليس لديك حساب؟' : "Don't have an account?" }}
            <a routerLink="/subscribe" class="text-white fw-medium ms-1 text-decoration-none">
              {{ isAr() ? 'اشترك الآن' : 'Subscribe Now' }}
            </a>
          </div>
        }
      </div>

      <!-- Role switcher -->
      <div class="d-flex justify-content-center gap-2 mt-3 flex-wrap">
        @for (r of publicRoles; track r.key) {
          <a [routerLink]="'/login/' + r.key"
             class="d-flex flex-column align-items-center gap-1 px-3 py-2 rounded-3 text-decoration-none"
             style="transition:.2s"
             [style.background]="roleParam()===r.key ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.07)'"
             [style.color]="roleParam()===r.key ? '#fff' : 'rgba(255,255,255,.45)'">
            <i class="bi {{ r.icon }} fs-5"></i>
            <span style="font-size:.7rem;font-weight:500">{{ isAr() ? r.ar : r.en }}</span>
          </a>
        }
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  private readonly fb    = inject(FormBuilder);
  private readonly auth  = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router= inject(Router);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly roleParam = signal('student');
  readonly loading   = signal(false);
  readonly showPwd   = signal(false);
  readonly err       = signal<string | null>(null);
  readonly cfg       = computed(() => ROLES[this.roleParam()]);

  readonly publicRoles = [
    { key:'student',    ar:'طالب',     en:'Student',   icon:'bi-mortarboard' },
    { key:'teacher',    ar:'معلم',     en:'Teacher',   icon:'bi-person-badge' },
    { key:'parent',     ar:'ولي أمر', en:'Parent',    icon:'bi-people-fill' },
    { key:'supervisor', ar:'مشرف',    en:'Supervisor', icon:'bi-eye' },
    { key:'admin',      ar:'مدير',    en:'Admin',      icon:'bi-shield-lock' },
  ];

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit() {
    this.route.params.subscribe(p => {
      this.roleParam.set(p['role'] ?? 'student');
      this.err.set(null);
      this.form.reset();
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.err.set(null);
    const roleMap: Record<string, UserRole> = {
      admin:'Admin', supervisor:'Supervisor', teacher:'Teacher', student:'Student', parent:'Parent'
    };
    this.auth.login(this.form.value.email!, this.form.value.password!, roleMap[this.roleParam()]).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) this.router.navigate([this.auth.getDashboardPath()]);
        else this.err.set(this.isAr() ? res.messageAr : res.messageEn);
      },
      error: e => {
        this.loading.set(false);
        this.err.set(this.isAr() ? (e.error?.messageAr ?? 'بيانات غير صحيحة') : (e.error?.messageEn ?? 'Invalid credentials'));
      }
    });
  }
}
