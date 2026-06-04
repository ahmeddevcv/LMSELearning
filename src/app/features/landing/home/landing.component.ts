import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="text-center py-5" style="max-width:800px">
      <!-- Badge -->
      <div class="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill mb-4"
           style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.85);font-size:.85rem">
        🎓 {{ isAr() ? 'منصة التعليم الأولى في مصر والخليج' : 'The #1 LMS in Egypt & Gulf' }}
      </div>

      <!-- Hero heading -->
      <h1 class="display-4 fw-bold text-white mb-3 lh-sm">
        {{ isAr() ? 'تعلّم بلا حدود' : 'Learn Without Limits' }}
      </h1>
      <p class="lead mb-5" style="color:rgba(255,255,255,.65);max-width:560px;margin:0 auto 2rem">
        {{ isAr()
            ? 'منصة متكاملة لتعليم KG1 حتى الصف 12 بمناهج مصرية وخليجية وIG وأمريكية'
            : 'Complete platform for KG1–Grade 12 with Egyptian, Gulf, IG & American curricula' }}
      </p>

      <!-- CTAs -->
      <div class="d-flex justify-content-center gap-3 flex-wrap mb-5">
        <a routerLink="/subscribe" class="btn btn-light fw-bold px-5 py-3 rounded-3 shadow">
          🚀 {{ isAr() ? 'ابدأ الآن' : 'Get Started' }}
        </a>
        <a routerLink="/catalog"
           class="btn px-5 py-3 rounded-3 fw-semibold"
           style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);color:#fff">
          📚 {{ isAr() ? 'تصفح المواد' : 'Browse Catalog' }}
        </a>
      </div>

      <!-- Stats -->
      <div class="row g-4 justify-content-center mb-5">
        @for (s of stats; track s.val) {
          <div class="col-4 col-md-3">
            <div class="fw-bold text-white" style="font-size:1.8rem">{{ s.val }}</div>
            <div style="color:rgba(255,255,255,.5);font-size:.8rem">{{ isAr() ? s.ar : s.en }}</div>
          </div>
        }
      </div>

      <!-- Login shortcuts -->
      <p style="color:rgba(255,255,255,.35);font-size:.82rem" class="mb-3">
        {{ isAr() ? 'لديك حساب؟ اختر دورك:' : 'Already have an account? Choose your role:' }}
      </p>
      <div class="d-flex justify-content-center gap-2 flex-wrap">
        @for (p of portals; track p.role) {
          <a [routerLink]="'/login/' + p.role"
             class="d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-decoration-none"
             style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.65);font-size:.82rem;transition:.2s"
             onmouseover="this.style.background='rgba(255,255,255,.18)'"
             onmouseout="this.style.background='rgba(255,255,255,.08)'">
            <i class="bi {{ p.icon }}"></i> {{ isAr() ? p.ar : p.en }}
          </a>
        }
      </div>
    </div>
  `
})
export class LandingComponent {
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;
  readonly stats = [
    { val:'+500', ar:'طالب نشط',   en:'Active Students' },
    { val:'+50',  ar:'معلم متميز', en:'Expert Teachers' },
    { val:'4',    ar:'مناهج',      en:'Curricula' },
  ];
  readonly portals = [
    { role:'student',    ar:'طالب',    en:'Student',    icon:'bi-mortarboard' },
    { role:'teacher',    ar:'معلم',    en:'Teacher',    icon:'bi-person-badge' },
    { role:'parent',     ar:'ولي أمر', en:'Parent',    icon:'bi-people-fill' },
    { role:'supervisor', ar:'مشرف',   en:'Supervisor', icon:'bi-eye' },
    { role:'admin',      ar:'مدير',   en:'Admin',      icon:'bi-shield-lock' },
  ];
}
