import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="text-center" style="max-width:420px">
      <div class="p-5 rounded-4" style="background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)">
        <div class="mb-3" style="font-size:4rem">{{ success ? '🎉' : '❌' }}</div>
        <h3 class="fw-bold text-white mb-2">
          {{ success ? (isAr() ? 'تم الدفع بنجاح!' : 'Payment Successful!') : (isAr() ? 'تم إلغاء الدفع' : 'Payment Cancelled') }}
        </h3>
        <p class="mb-4" style="color:rgba(255,255,255,.6);font-size:.875rem">
          {{ success
            ? (isAr() ? 'تم تفعيل اشتراكك. ستصلك رسالة تأكيد.' : 'Your subscription is active. Check your email.')
            : (isAr() ? 'لم يتم إتمام الدفع. يمكنك المحاولة مرة أخرى.' : 'Payment was not completed. You can try again.') }}
        </p>
        <div class="d-flex flex-column gap-2">
          @if (success && auth.isAuthenticated()) {
            <a [routerLink]="auth.getDashboardPath()" class="btn btn-light fw-semibold">
              {{ isAr() ? 'إلى لوحة التحكم' : 'Go to Dashboard' }}
            </a>
          }
          @if (success && !auth.isAuthenticated()) {
            <a routerLink="/login/student" class="btn btn-light fw-semibold">
              {{ isAr() ? 'تسجيل الدخول' : 'Login' }}
            </a>
          }
          @if (!success) {
            <a routerLink="/subscribe" class="btn btn-light fw-semibold">
              {{ isAr() ? 'حاول مرة أخرى' : 'Try Again' }}
            </a>
          }
          <a routerLink="/" class="btn btn-outline-light">{{ isAr() ? 'الصفحة الرئيسية' : 'Home' }}</a>
        </div>
      </div>
    </div>
  `
})
export class PaymentResultComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;
  success = false;
  ngOnInit() { this.success = this.route.snapshot.url.some(s => s.path === 'success'); }
}
