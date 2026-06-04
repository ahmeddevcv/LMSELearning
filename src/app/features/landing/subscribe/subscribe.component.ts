import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogService, SubscriptionService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { Subject, GradeLevel, Curriculum } from '../../../core/models';
import { PHONE_PATTERN, PHONE_PLACEHOLDER, normalizePhone } from '../../../core/validators/phone';

@Component({
  selector: 'app-subscribe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div style="width:100%;max-width:620px">
      <div class="text-center mb-4">
        <h2 class="fw-bold text-white">{{ isAr() ? 'اشترك الآن' : 'Subscribe Now' }}</h2>
        <p style="color:rgba(255,255,255,.6);font-size:.875rem">
          {{ isAr() ? 'أنشئ حسابك واختر موادك' : 'Create your account and pick your subjects' }}
        </p>
      </div>

      <div class="p-4 rounded-4"
           style="background:rgba(255,255,255,.1);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.2)">

        <!-- Step indicator -->
        <div class="d-flex align-items-center justify-content-center gap-2 mb-4">
          @for (s of [1,2,3]; track s) {
            <div class="d-flex align-items-center gap-2">
              <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                   style="width:32px;height:32px;font-size:.85rem"
                   [style.background]="step()>=s ? '#fff' : 'rgba(255,255,255,.2)'"
                   [style.color]="step()>=s ? '#4338ca' : 'rgba(255,255,255,.4)'">
                {{ step() > s ? '✓' : s }}
              </div>
              @if (s < 3) {
                <div style="width:40px;height:2px;border-radius:2px"
                     [style.background]="step()>s ? '#fff' : 'rgba(255,255,255,.2)'"></div>
              }
            </div>
          }
        </div>

        <!-- STEP 1: Info -->
        @if (step() === 1) {
          <form [formGroup]="infoForm" (ngSubmit)="nextStep()" novalidate>
            <h6 class="fw-semibold text-white mb-3">{{ isAr() ? 'البيانات الشخصية' : 'Personal Information' }}</h6>
            <div class="row g-3">
              <div class="col-sm-6">
                <label class="form-label text-white-50 small">{{ isAr() ? 'اسم الطالب' : 'Student Name' }}</label>
                <input formControlName="studentName" class="form-control bg-transparent text-white border-secondary"
                       [placeholder]="isAr() ? 'الاسم بالكامل' : 'Full name'">
              </div>
              <div class="col-sm-6">
                <label class="form-label text-white-50 small">{{ isAr() ? 'البريد الإلكتروني للطالب' : 'Student Email' }}</label>
                <input formControlName="email" type="email" class="form-control bg-transparent text-white border-secondary"
                       placeholder="student@email.com">
              </div>
              <div class="col-sm-6">
                <label class="form-label text-white-50 small">{{ isAr() ? 'البريد الإلكتروني لولي الأمر' : 'Parent Email' }}</label>
                <input formControlName="parentEmail" type="email" class="form-control bg-transparent text-white border-secondary"
                       placeholder="parent@email.com">
                @if (infoForm.hasError('sameEmail') && infoForm.get('parentEmail')?.touched) {
                  <small class="d-block mt-1 text-warning" style="font-size:.72rem">{{ isAr() ? 'لازم يكون مختلف عن بريد الطالب' : 'Must be different from the student email' }}</small>
                }
              </div>
              <div class="col-sm-6">
                <label class="form-label text-white-50 small">{{ isAr() ? 'رقم الطالب (مع كود الدولة)' : 'Student Phone (with country code)' }}</label>
                <input formControlName="phone" dir="ltr" class="form-control bg-transparent text-white border-secondary"
                       [placeholder]="phonePlaceholder">
                <small class="d-block mt-1" style="color:rgba(255,255,255,.45);font-size:.72rem">{{ isAr() ? 'مثال: +201129841926 — بكود الدولة' : 'e.g. +201129841926 — with country code' }}</small>
              </div>
              <div class="col-sm-6">
                <label class="form-label text-white-50 small">{{ isAr() ? 'رقم ولي الأمر (مع كود الدولة)' : 'Parent Phone (with country code)' }}</label>
                <input formControlName="parentPhone" dir="ltr" class="form-control bg-transparent text-white border-secondary"
                       [placeholder]="phonePlaceholder">
                <small class="d-block mt-1" style="color:rgba(255,255,255,.45);font-size:.72rem">{{ isAr() ? 'مثال: +201129841926 — بكود الدولة' : 'e.g. +201129841926 — with country code' }}</small>
              </div>
              <div class="col-sm-6">
                <label class="form-label text-white-50 small">{{ isAr() ? 'الصف الدراسي' : 'Grade' }}</label>
                <select formControlName="gradeLevel" class="form-select bg-transparent text-white border-secondary">
                  <option value="" class="text-dark">{{ isAr() ? 'اختر الصف' : 'Select grade' }}</option>
                  @for (g of grades; track g) { <option [value]="g" class="text-dark">{{ g }}</option> }
                </select>
              </div>
              <div class="col-sm-6">
                <label class="form-label text-white-50 small">{{ isAr() ? 'المنهج' : 'Curriculum' }}</label>
                <select formControlName="curriculum" class="form-select bg-transparent text-white border-secondary">
                  <option value="" class="text-dark">{{ isAr() ? 'اختر المنهج' : 'Select curriculum' }}</option>
                  @for (c of curricula; track c.val) { <option [value]="c.val" class="text-dark">{{ isAr() ? c.ar : c.en }}</option> }
                </select>
              </div>
            </div>
            <button type="submit" class="btn btn-light w-100 mt-4 fw-semibold">
              {{ isAr() ? 'التالي ←' : 'Next →' }}
            </button>
          </form>
        }

        <!-- STEP 2: Subjects -->
        @if (step() === 2) {
          <div>
            <h6 class="fw-semibold text-white mb-3">{{ isAr() ? 'اختر المواد' : 'Choose Subjects' }}</h6>
            @if (loadingSubjects()) {
              <div class="text-center py-4"><div class="spinner-border text-light spinner-border-sm"></div></div>
            } @else {
              <div style="max-height:300px;overflow-y:auto" class="d-flex flex-column gap-2">
                @for (s of subjects(); track s.id) {
                  <label class="d-flex align-items-center gap-3 p-3 rounded-3 cursor-pointer"
                         style="border:1px solid"
                         [style.border-color]="selected().includes(s.id) ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.2)'"
                         [style.background]="selected().includes(s.id) ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.06)'">
                    <input type="checkbox" class="form-check-input m-0"
                           [checked]="selected().includes(s.id)"
                           (change)="toggleSub(s.id)">
                    <div class="flex-grow-1">
                      <div class="text-white fw-medium" style="font-size:.875rem">{{ isAr() ? s.nameAr : s.nameEn }}</div>
                      @if (s.teacherNameAr) {
                        <div style="color:rgba(255,255,255,.5);font-size:.75rem">{{ isAr() ? s.teacherNameAr : s.teacherNameEn }}</div>
                      }
                    </div>
                    <span class="text-white fw-semibold">{{ s.currentPrice }} EGP</span>
                  </label>
                }
              </div>
              <div class="d-flex align-items-center justify-content-between p-3 rounded-3 mt-3"
                   style="background:rgba(255,255,255,.12)">
                <span style="color:rgba(255,255,255,.7)">{{ isAr() ? 'الإجمالي' : 'Total' }}</span>
                <span class="text-white fw-bold fs-5">{{ total() }} EGP</span>
              </div>
              <div class="d-flex gap-2 mt-3">
                <button class="btn btn-outline-light flex-fill" (click)="step.set(1)">← {{ isAr() ? 'السابق' : 'Back' }}</button>
                <button class="btn btn-light flex-fill fw-semibold" [disabled]="!selected().length" (click)="step.set(3)">
                  {{ isAr() ? 'التالي →' : 'Next →' }}
                </button>
              </div>
            }
          </div>
        }

        <!-- STEP 3: Confirm -->
        @if (step() === 3) {
          <div>
            <h6 class="fw-semibold text-white mb-3">{{ isAr() ? 'تأكيد الاشتراك' : 'Confirm Subscription' }}</h6>
            <div class="rounded-3 p-3 mb-3" style="background:rgba(255,255,255,.1)">
              @for (row of summary(); track row.label) {
                <div class="d-flex justify-content-between mb-2" style="font-size:.85rem">
                  <span style="color:rgba(255,255,255,.6)">{{ row.label }}</span>
                  <span class="text-white fw-medium">{{ row.value }}</span>
                </div>
              }
              <hr style="border-color:rgba(255,255,255,.2)">
              <div class="d-flex justify-content-between">
                <span style="color:rgba(255,255,255,.6)">{{ isAr() ? 'الإجمالي' : 'Total' }}</span>
                <span class="text-white fw-bold fs-5">{{ total() }} EGP</span>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-outline-light flex-fill" (click)="step.set(2)">← {{ isAr() ? 'السابق' : 'Back' }}</button>
              <button class="btn btn-light flex-fill fw-semibold" [disabled]="paying()" (click)="checkout()">
                @if (paying()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                💳 {{ isAr() ? 'ادفع عبر Stripe' : 'Pay with Stripe' }}
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class SubscribeComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly catalog = inject(CatalogService);
  private readonly subSvc  = inject(SubscriptionService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly step            = signal(1);
  readonly subjects        = signal<Subject[]>([]);
  readonly selected        = signal<string[]>([]);
  readonly loadingSubjects = signal(true);
  readonly paying          = signal(false);
  readonly phonePlaceholder = PHONE_PLACEHOLDER;

  readonly grades: GradeLevel[] = ['KG1','KG2','Grade1','Grade2','Grade3','Grade4','Grade5','Grade6','Grade7','Grade8','Grade9','Grade10','Grade11','Grade12'];
  readonly curricula = [
    { val:'Egyptian', ar:'المصري',    en:'Egyptian' },
    { val:'Gulf',     ar:'الخليج',    en:'Gulf' },
    { val:'IG',       ar:'دولي IG',   en:'IG' },
    { val:'American', ar:'الأمريكي',  en:'American' },
  ];

  infoForm = this.fb.group({
    studentName: ['', [Validators.required, Validators.minLength(3)]],
    email:       ['', [Validators.required, Validators.email]],
    // Student and parent are separate user accounts (Users.Email is unique) — must differ.
    parentEmail: ['', [Validators.required, Validators.email]],
    phone:       ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    parentPhone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    gradeLevel:  ['', Validators.required],
    curriculum:  ['', Validators.required],
  }, {
    // Student and parent must use different emails (Users.Email is unique on the backend).
    validators: (g: AbstractControl) => {
      const e  = (g.get('email')?.value ?? '').trim().toLowerCase();
      const pe = (g.get('parentEmail')?.value ?? '').trim().toLowerCase();
      return e && pe && e === pe ? { sameEmail: true } : null;
    }
  });

  total = () => this.subjects()
    .filter(s => this.selected().includes(s.id))
    .reduce((sum, s) => sum + s.currentPrice, 0);

  summary = () => {
    const v = this.infoForm.value;
    return [
      { label: this.isAr() ? 'الاسم'  : 'Name',     value: v.studentName ?? '' },
      { label: this.isAr() ? 'البريد' : 'Email',    value: v.email ?? '' },
      { label: this.isAr() ? 'الصف'   : 'Grade',    value: v.gradeLevel ?? '' },
      { label: this.isAr() ? 'المواد' : 'Subjects', value: `${this.selected().length}` },
    ];
  };

  ngOnInit() {
    // Subjects are loaded per chosen grade + curriculum in nextStep() — see below.
  }

  nextStep() {
    if (this.infoForm.invalid) { this.infoForm.markAllAsTouched(); return; }
    // Load ONLY the subjects that match the student's grade + curriculum, so every
    // paid checkout maps to an existing group. (The webhook skips a subject that has
    // no matching group, which would leave a paid student with no subscription.)
    const v = this.infoForm.value;
    this.selected.set([]);
    this.loadingSubjects.set(true);
    this.step.set(2);
    this.catalog.getSubjects({ gradeLevel: v.gradeLevel!, curriculum: v.curriculum! }).subscribe(r => {
      this.subjects.set(r.success && r.data ? r.data : []);
      this.loadingSubjects.set(false);
    });
  }

  toggleSub(id: string) {
    this.selected.update(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  }

  checkout() {
    this.paying.set(true);
    const v = this.infoForm.value;
    // Phone is entered in international (E.164) format — just normalize the '+'.
    const pPhone = normalizePhone(v.parentPhone);

    this.subSvc.createCheckout({
      studentNameAr: v.studentName!,
      studentNameEn: v.studentName!,
      studentEmail: v.email!,
      parentNameAr: v.studentName! + ' Parent',
      parentNameEn: v.studentName! + ' Parent',
      parentEmail: v.parentEmail!,
      parentWhatsApp: pPhone,
      gradeLevel: v.gradeLevel as GradeLevel,
      curriculum: v.curriculum as Curriculum,
      subjectIds: this.selected(),
      bundleIds: [],
      planType: 'Monthly'
    }).subscribe({
      next: r => {
        this.paying.set(false);
        if (r.success && r.data?.checkoutUrl) window.location.href = r.data.checkoutUrl;
      },
      error: () => this.paying.set(false)
    });
  }
}
