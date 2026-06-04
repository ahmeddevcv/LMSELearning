import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { PlatformSettingsService } from '../../../core/services/platform-settings.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الإعدادات' : 'Settings' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'إعدادات المنصة العامة' : 'Platform configuration' }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="row g-4">
          @for (i of [1,2,3]; track i) { <div class="col-md-6"><app-skeleton type="card"/></div> }
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="row g-4">

            <!-- Platform Info -->
            <div class="col-lg-6">
              <div class="card h-100">
                <div class="card-header py-3">
                  <strong style="font-size:.9rem"><i class="bi bi-info-circle me-2 text-primary"></i>{{ isAr()?'معلومات المنصة':'Platform Info' }}</strong>
                </div>
                <div class="card-body d-flex flex-column gap-3" formGroupName="platform">
                  <div>
                    <label class="form-label small fw-medium">{{ isAr()?'اسم المنصة (عربي)':'Platform Name (AR)' }}</label>
                    <input formControlName="nameAr" class="form-control" placeholder="منصة التعليم">
                  </div>
                  <div>
                    <label class="form-label small fw-medium">{{ isAr()?'اسم المنصة (إنجليزي)':'Platform Name (EN)' }}</label>
                    <input formControlName="nameEn" class="form-control" placeholder="LMS Platform">
                  </div>
                  <div>
                    <label class="form-label small fw-medium">{{ isAr()?'البريد الرسمي':'Official Email' }}</label>
                    <input formControlName="supportEmail" type="email" class="form-control" placeholder="support@lms.com">
                  </div>
                  <div>
                    <label class="form-label small fw-medium">{{ isAr()?'رقم الواتساب':'WhatsApp Number' }}</label>
                    <input formControlName="whatsappNumber" class="form-control" placeholder="+201xxxxxxxxx">
                  </div>
                </div>
              </div>
            </div>

            <!-- Subscription Settings -->
            <div class="col-lg-6">
              <div class="card h-100">
                <div class="card-header py-3">
                  <strong style="font-size:.9rem"><i class="bi bi-credit-card me-2 text-success"></i>{{ isAr()?'إعدادات الاشتراكات':'Subscription Settings' }}</strong>
                </div>
                <div class="card-body d-flex flex-column gap-3" formGroupName="subscriptions">
                  <div>
                    <label class="form-label small fw-medium">{{ isAr()?'مدة الاشتراك الافتراضية (أشهر)':'Default Duration (months)' }}</label>
                    <input formControlName="defaultMonths" type="number" class="form-control" min="1" max="24">
                  </div>
                  <div>
                    <label class="form-label small fw-medium">{{ isAr()?'تحذير انتهاء قبل (أيام)':'Expiry Warning (days before)' }}</label>
                    <input formControlName="expiryWarningDays" type="number" class="form-control" min="1" max="30">
                  </div>
                  <div class="form-check form-switch">
                    <input formControlName="allowFreeTrials" class="form-check-input" type="checkbox" role="switch" id="trialSwitch">
                    <label class="form-check-label" for="trialSwitch">{{ isAr()?'السماح بالتجربة المجانية':'Allow Free Trials' }}</label>
                  </div>
                  <div class="form-check form-switch">
                    <input formControlName="autoRenew" class="form-check-input" type="checkbox" role="switch" id="renewSwitch">
                    <label class="form-check-label" for="renewSwitch">{{ isAr()?'التجديد التلقائي':'Auto-Renew' }}</label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Session Settings — hidden for now (these are not consumed by the backend):
                 recordings auto-upload to bunny.net after a session, and session duration /
                 max-students are chosen per session / per group. Kept here for later.
                 (Default Meeting URL was removed entirely — meet links are set per group/session.)

            <div class="col-lg-6">
              <div class="card h-100">
                <div class="card-header py-3">
                  <strong style="font-size:.9rem"><i class="bi bi-camera-video me-2 text-warning"></i>{{ isAr()?'إعدادات الحصص':'Session Settings' }}</strong>
                </div>
                <div class="card-body d-flex flex-column gap-3" formGroupName="sessions">
                  <div>
                    <label class="form-label small fw-medium">{{ isAr()?'مدة الحصة الافتراضية (دقيقة)':'Default Duration (minutes)' }}</label>
                    <input formControlName="defaultDurationMinutes" type="number" class="form-control" min="30" max="180">
                  </div>
                  <div>
                    <label class="form-label small fw-medium">{{ isAr()?'الحد الأقصى للطلاب في المجموعة':'Max Students per Group' }}</label>
                    <input formControlName="maxStudentsPerGroup" type="number" class="form-control" min="1" max="200">
                  </div>
                  <div class="form-check form-switch">
                    <input formControlName="allowRecording" class="form-check-input" type="checkbox" role="switch" id="recSwitch">
                    <label class="form-check-label" for="recSwitch">{{ isAr()?'السماح بالتسجيل':'Allow Recording' }}</label>
                  </div>
                </div>
              </div>
            </div>
            -->

            <!-- Notification Settings -->
            <div class="col-lg-6">
              <div class="card h-100">
                <div class="card-header py-3">
                  <strong style="font-size:.9rem"><i class="bi bi-bell me-2 text-danger"></i>{{ isAr()?'إعدادات الإشعارات':'Notification Settings' }}</strong>
                </div>
                <div class="card-body d-flex flex-column gap-3" formGroupName="notifications">
                  <div class="form-check form-switch">
                    <input formControlName="emailEnabled" class="form-check-input" type="checkbox" role="switch" id="emailSwitch">
                    <label class="form-check-label" for="emailSwitch">{{ isAr()?'إشعارات البريد الإلكتروني':'Email Notifications' }}</label>
                  </div>
                  <div class="form-check form-switch">
                    <input formControlName="whatsappEnabled" class="form-check-input" type="checkbox" role="switch" id="waSwitch">
                    <label class="form-check-label" for="waSwitch">{{ isAr()?'إشعارات واتساب':'WhatsApp Notifications' }}</label>
                  </div>
                  <div class="form-check form-switch">
                    <input formControlName="sessionReminder" class="form-check-input" type="checkbox" role="switch" id="remSwitch">
                    <label class="form-check-label" for="remSwitch">{{ isAr()?'تذكير قبل الحصة':'Pre-session Reminder' }}</label>
                  </div>
                  <div>
                    <label class="form-label small fw-medium">{{ isAr()?'التذكير قبل (دقيقة)':'Reminder Before (minutes)' }}</label>
                    <input formControlName="reminderMinutes" type="number" class="form-control" min="5" max="60">
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Save button -->
          <div class="d-flex justify-content-end mt-4">
            <button type="submit" class="btn btn-primary btn-lg px-5" [disabled]="saving()">
              @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
              <i class="bi bi-check-lg me-1"></i>
              {{ isAr()?'حفظ الإعدادات':'Save Settings' }}
            </button>
          </div>
        </form>
      }
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly platform = inject(PlatformSettingsService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly loading = signal(true);
  readonly saving = signal(false);

  form = this.fb.group({
    platform: this.fb.group({
      nameAr: ['منصة التعليم'],
      nameEn: ['LMS Platform'],
      supportEmail: ['support@lms.com', Validators.email],
      whatsappNumber: [''],
    }),
    subscriptions: this.fb.group({
      defaultMonths: [3],
      expiryWarningDays: [7],
      allowFreeTrials: [true],
      autoRenew: [false],
    }),
    // Session Settings hidden in the UI for now (not consumed by the backend).
    // Default Meeting URL was removed. Kept for later — re-add the inputs in the
    // template above and uncomment these controls to re-enable.
    sessions: this.fb.group({
      // defaultDurationMinutes: [60],
      // maxStudentsPerGroup: [30],
      // allowRecording: [true],
    }),
    notifications: this.fb.group({
      emailEnabled: [true],
      whatsappEnabled: [true],
      sessionReminder: [true],
      reminderMinutes: [30],
    }),
  });

  ngOnInit() {
    this.adminSvc.getSettings().subscribe(r => {
      if (r.success && r.data) this.form.patchValue(r.data);
      this.loading.set(false);
    });
  }

  save() {
    this.saving.set(true);
    this.adminSvc.updateSettings(this.form.value).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.toast.success('تم حفظ الإعدادات', 'Settings saved');
          // Refresh the platform branding signal so name updates everywhere immediately
          this.platform.reload();
        }
      },
      error: () => this.saving.set(false)
    });
  }
}
