import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/api.services';
import { LanguageService } from '../../core/services/language.service';
import { ToastService } from '../../core/services/toast.service';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error.component';
import { PHONE_PATTERN, PHONE_PLACEHOLDER, normalizePhone } from '../../core/validators/phone';
import { mediaUrl } from '../../core/utils/media';

/**
 * Self-service profile — shared by every role (Admin / Teacher / Student / …).
 * Edits the *current* user: name (AR/EN) + phone, and changes the avatar.
 * Email is read-only (the backend PUT /profiles/me does not change it).
 * Uses the role-agnostic endpoints: PUT /profiles/me and POST /profiles/me/photo.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent, FieldErrorComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الملف الشخصي' : 'My Profile' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'عدّل بياناتك وصورتك الشخصية' : 'Edit your details and photo' }}</p>
        </div>
      </div>

      @if (loading()) {
        <div class="row g-4">
          <div class="col-lg-4"><app-skeleton type="card"/></div>
          <div class="col-lg-8"><app-skeleton type="card"/></div>
        </div>
      } @else {
        <div class="row g-4">
          <!-- Photo -->
          <div class="col-lg-4">
            <div class="card h-100">
              <div class="card-body text-center d-flex flex-column align-items-center gap-3 py-4">
                <div class="avatar" style="width:110px;height:110px;font-size:2.5rem;overflow:hidden">
                  @if (avatarUrl(); as src) {
                    <img [src]="src" alt="avatar" style="width:100%;height:100%;object-fit:cover">
                  } @else {
                    {{ user()?.fullNameAr?.charAt(0) ?? '?' }}
                  }
                </div>
                <div>
                  <div class="fw-semibold">{{ isAr() ? user()?.fullNameAr : user()?.fullNameEn }}</div>
                  <div class="text-secondary" style="font-size:.8rem">{{ roleLabel() }}</div>
                </div>
                <input type="file" #photoInput accept="image/*" hidden (change)="onPhoto($event)">
                <button type="button" class="btn btn-outline-primary btn-sm" [disabled]="uploading()" (click)="photoInput.click()">
                  @if (uploading()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                  <i class="bi bi-camera me-1"></i>{{ isAr() ? 'تغيير الصورة' : 'Change Photo' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="col-lg-8">
            <div class="card h-100">
              <div class="card-header py-3">
                <strong style="font-size:.9rem"><i class="bi bi-person-vcard me-2 text-primary"></i>{{ isAr() ? 'البيانات الشخصية' : 'Personal Info' }}</strong>
              </div>
              <form [formGroup]="form" (ngSubmit)="save()">
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-sm-6">
                      <label class="form-label small fw-medium">{{ isAr() ? 'الاسم (عربي)' : 'Name (AR)' }}</label>
                      <input formControlName="fullNameAr" class="form-control" placeholder="أحمد محمد">
                      <app-field-error [c]="form.get('fullNameAr')" [label]="isAr() ? 'الاسم بالعربي' : 'Arabic Name'"/>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small fw-medium">{{ isAr() ? 'الاسم (إنجليزي)' : 'Name (EN)' }}</label>
                      <input formControlName="fullNameEn" class="form-control" placeholder="Ahmed Mohamed">
                      <app-field-error [c]="form.get('fullNameEn')" [label]="isAr() ? 'الاسم بالإنجليزي' : 'English Name'"/>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small fw-medium">{{ isAr() ? 'البريد الإلكتروني' : 'Email' }}</label>
                      <input class="form-control bg-light" [value]="email()" readonly dir="ltr">
                      <small class="text-secondary" style="font-size:.72rem">{{ isAr() ? 'لا يمكن تغيير البريد الإلكتروني' : 'Email cannot be changed' }}</small>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small fw-medium">{{ isAr() ? 'الهاتف (مع كود الدولة)' : 'Phone (with country code)' }}</label>
                      <input formControlName="phoneNumber" type="tel" dir="ltr" class="form-control" [placeholder]="phonePlaceholder">
                      <app-field-error [c]="form.get('phoneNumber')" [label]="isAr() ? 'الهاتف' : 'Phone'"/>
                      <small class="text-secondary d-block mt-1" style="font-size:.72rem">{{ isAr() ? 'مثال: +201129841926 — بكود الدولة' : 'e.g. +201129841926 — with country code' }}</small>
                    </div>
                  </div>
                </div>
                <div class="card-footer d-flex justify-content-end bg-transparent">
                  <button type="submit" class="btn btn-primary px-4" [disabled]="saving()">
                    @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                    <i class="bi bi-check-lg me-1"></i>{{ isAr() ? 'حفظ التغييرات' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>

            <!-- Change Password -->
            <div class="card mt-4">
              <div class="card-header py-3">
                <strong style="font-size:.9rem"><i class="bi bi-shield-lock me-2 text-primary"></i>{{ isAr() ? 'تغيير كلمة المرور' : 'Change Password' }}</strong>
              </div>
              <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-sm-6">
                      <label class="form-label small fw-medium">{{ isAr() ? 'كلمة المرور الحالية' : 'Current Password' }}</label>
                      <input formControlName="currentPassword" type="password" class="form-control" dir="ltr">
                      <app-field-error [c]="passwordForm.get('currentPassword')" [label]="isAr() ? 'كلمة المرور الحالية' : 'Current Password'"/>
                    </div>
                    <div class="col-sm-6">
                      <label class="form-label small fw-medium">{{ isAr() ? 'كلمة المرور الجديدة' : 'New Password' }}</label>
                      <input formControlName="newPassword" type="password" class="form-control" dir="ltr">
                      <app-field-error [c]="passwordForm.get('newPassword')" [label]="isAr() ? 'كلمة المرور الجديدة' : 'New Password'"/>
                    </div>
                  </div>
                </div>
                <div class="card-footer d-flex justify-content-end bg-transparent">
                  <button type="submit" class="btn btn-primary px-4" [disabled]="changingPassword()">
                    @if (changingPassword()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                    <i class="bi bi-check-lg me-1"></i>{{ isAr() ? 'تغيير كلمة المرور' : 'Change Password' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly profileSvc = inject(ProfileService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly loading   = signal(true);
  readonly saving    = signal(false);
  readonly uploading = signal(false);
  readonly changingPassword = signal(false);
  readonly email     = signal('');
  readonly prefLang  = signal<'ar' | 'en'>('ar');   // backend requires 'ar'|'en' on update
  readonly phonePlaceholder = PHONE_PLACEHOLDER;

  readonly user      = this.auth.currentUser$;
  readonly avatarUrl = computed(() => mediaUrl(this.user()?.profileImageUrl));

  // Localized label of the current user's role (shown under the avatar).
  readonly roleLabel = computed(() => {
    const role = this.user()?.role ?? '';
    const ar: Record<string, string> = { Admin:'مدير', Supervisor:'مشرف', Teacher:'معلم', Student:'طالب', Parent:'ولي أمر' };
    const en: Record<string, string> = { Admin:'Admin', Supervisor:'Supervisor', Teacher:'Teacher', Student:'Student', Parent:'Parent' };
    return (this.isAr() ? ar[role] : en[role]) ?? role;
  });

  form = this.fb.group({
    fullNameAr:  ['', [Validators.required, Validators.maxLength(200)]],
    fullNameEn:  ['', [Validators.required, Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit() {
    // Pull fresh data from /auth/me (keeps the cached user + header in sync too).
    this.auth.getCurrentUser().subscribe({
      next: r => {
        const u: any = r.data;
        if (r.success && u) {
          this.form.patchValue({
            fullNameAr:  u.fullNameAr ?? '',
            fullNameEn:  u.fullNameEn ?? '',
            phoneNumber: u.phoneNumber ?? u.phone ?? '',
          });
          this.email.set(u.email ?? '');
          this.prefLang.set(u.preferredLanguage === 'en' ? 'en' : 'ar');
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    this.profileSvc.updateMe({
      fullNameAr:  v.fullNameAr!,
      fullNameEn:  v.fullNameEn!,
      phoneNumber: normalizePhone(v.phoneNumber),
      preferredLanguage: this.prefLang(),   // validator requires 'ar'|'en'
    } as any).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.toast.success('تم حفظ البيانات', 'Profile saved');
          this.auth.getCurrentUser().subscribe();   // refresh the sidebar name
        }
      },
      error: () => this.saving.set(false),
    });
  }

  onPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.profileSvc.uploadPhoto(file).subscribe({
      next: r => {
        this.uploading.set(false);
        if (r.success) {
          this.toast.success('تم تحديث الصورة', 'Photo updated');
          this.auth.getCurrentUser().subscribe();   // refresh avatar everywhere
        }
        input.value = '';
      },
      error: () => { this.uploading.set(false); input.value = ''; },
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.changingPassword.set(true);
    const v = this.passwordForm.value;
    this.auth.changePassword({
      currentPassword: v.currentPassword!,
      newPassword: v.newPassword!
    }).subscribe({
      next: r => {
        this.changingPassword.set(false);
        if (r.success) {
          this.toast.success('تم تغيير كلمة المرور بنجاح', 'Password changed successfully');
          this.passwordForm.reset();
        }
      },
      error: () => this.changingPassword.set(false)
    });
  }
}
