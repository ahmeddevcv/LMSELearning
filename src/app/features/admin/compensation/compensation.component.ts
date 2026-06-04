import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { TeacherCompensation } from '../../../core/models';

@Component({
  selector: 'app-compensation',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, ConfirmModalComponent, PaginationComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'مكافآت المعلمين' : 'Teacher Compensation' }}</h1>
          <p class="section-subtitle">{{ pendingCount() }} {{ isAr() ? 'مكافأة معلقة' : 'pending' }}</p>
        </div>
        <!-- Filter -->
        <div class="d-flex gap-2">
          @for (f of filters; track f.v) {
            <button class="btn btn-sm" [class]="filterPaid()===f.v?'btn-primary':'btn-outline-secondary'"
                    (click)="filterPaid.set(f.v); load(1)">
              {{ isAr()?f.ar:f.en }}
            </button>
          }
        </div>
      </div>

      <!-- Summary cards -->
      <div class="row g-3 mb-4 anim-stagger">
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon stat-icon-warning"><i class="bi bi-hourglass-split fs-4"></i></div>
            <div><div class="stat-label">{{ isAr()?'معلق الصرف':'Pending' }}</div><div class="stat-value" style="font-size:1.3rem">{{ pendingTotal() | number }} <small style="font-size:.65rem">EGP</small></div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon stat-icon-success"><i class="bi bi-check-circle fs-4"></i></div>
            <div><div class="stat-label">{{ isAr()?'تم الصرف':'Paid' }}</div><div class="stat-value" style="font-size:1.3rem">{{ paidTotal() | number }} <small style="font-size:.65rem">EGP</small></div></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0 table-cards">
            <thead><tr>
              <th>{{ isAr()?'المعلم':'Teacher' }}</th>
              <th>{{ isAr()?'الشهر':'Month' }}</th>
              <th>{{ isAr()?'الراتب الأساسي':'Base' }}</th>
              <th>{{ isAr()?'المكافأة':'Bonus' }}</th>
              <th>{{ isAr()?'الإجمالي':'Total' }}</th>
              <th>{{ isAr()?'الحالة':'Status' }}</th>
              <th></th>
            </tr></thead>
            <tbody>
              @if (loading()) {
                <app-skeleton type="table" [count]="6" [colCount]="7"/>
              } @else {
                @for (c of comps(); track c.id) {
                  <tr>
                    <td [attr.data-label]="isAr()?'المعلم':'Teacher'">
                      <div class="d-flex align-items-center gap-2">
                        <div class="avatar" style="width:32px;height:32px;font-size:.75rem">{{ c.teacherNameAr.charAt(0) }}</div>
                        <span class="fw-medium" style="font-size:.85rem">{{ isAr()?c.teacherNameAr:c.teacherNameEn }}</span>
                      </div>
                    </td>
                    <td style="font-size:.82rem" [attr.data-label]="isAr()?'الشهر':'Month'">{{ monthName(c.month) }} {{ c.year }}</td>
                    <td style="font-size:.82rem" [attr.data-label]="isAr()?'الراتب الأساسي':'Base'">{{ c.baseSalary | number }} EGP</td>
                    <td style="font-size:.82rem;color:var(--lms-success)" [attr.data-label]="isAr()?'المكافأة':'Bonus'">
                      @if (c.bonusAmount > 0) { <span class="fw-medium">+{{ c.bonusAmount | number }} EGP</span> }
                      @else { <span class="text-muted">—</span> }
                    </td>
                    <td class="fw-bold" style="font-size:.9rem" [attr.data-label]="isAr()?'الإجمالي':'Total'">{{ c.totalAmount | number }} EGP</td>
                    <td [attr.data-label]="isAr()?'الحالة':'Status'">
                      @if (c.isPaid) {
                        <div>
                          <span class="badge badge-active">{{ isAr()?'تم الصرف':'Paid' }}</span>
                          <div class="text-muted" style="font-size:.7rem">{{ c.paidAt | date:'d MMM y' }}</div>
                        </div>
                      } @else {
                        <span class="badge badge-warning">{{ isAr()?'معلق':'Pending' }}</span>
                      }
                    </td>
                    <td class="cell-actions">
                      @if (!c.isPaid) {
                        <button class="btn btn-sm btn-success" (click)="confirmPay(c)" [disabled]="saving()">
                          <i class="bi bi-cash-coin me-1"></i>
                          {{ isAr()?'صرف':'Pay Now' }}
                        </button>
                      }
                    </td>
                  </tr>
                }
                @if (!comps().length) {
                  <tr><td colspan="7" class="cell-empty text-center py-5 text-secondary">
                    <i class="bi bi-wallet2 d-block mb-2 fs-1 opacity-40"></i>
                    {{ isAr()?'لا توجد مكافآت':'No compensation records' }}
                  </td></tr>
                }
              }
            </tbody>
          </table>
        </div>
        <app-pagination [currentPage]="page()" [totalPages]="totalPages()"
          [totalCount]="total()" [pageSize]="20" (pageChange)="load($event)"/>
      </div>
    </div>

    <app-confirm-modal [open]="payModal()"
      [titleAr]="'تأكيد صرف المكافأة'"
      [titleEn]="'Confirm Compensation Payout'"
      [messageAr]="'هل تريد صرف مبلغ ' + (payTarget()?.totalAmount ?? 0) + ' EGP للمعلم ' + (payTarget()?.teacherNameAr ?? '') + '؟'"
      [messageEn]="'Pay ' + (payTarget()?.totalAmount ?? 0) + ' EGP to teacher ' + (payTarget()?.teacherNameEn ?? '') + '?'"
      [danger]="false" [confirmLabelAr]="'صرف الآن'" [confirmLabelEn]="'Pay now'"
      [loading]="saving()" (confirm)="doPay()" (cancelled)="payModal.set(false)"/>
  `
})
export class CompensationComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly comps = signal<TeacherCompensation[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly filterPaid = signal<string>('');
  readonly payModal = signal(false);
  readonly payTarget = signal<TeacherCompensation | null>(null);

  pendingCount = () => this.comps().filter(c => !c.isPaid).length;
  pendingTotal = () => this.comps().filter(c => !c.isPaid).reduce((s, c) => s + c.totalAmount, 0);
  paidTotal = () => this.comps().filter(c => c.isPaid).reduce((s, c) => s + c.totalAmount, 0);

  readonly filters = [
    { v: '', ar: 'الكل', en: 'All' },
    { v: 'false', ar: 'معلق', en: 'Pending' },
    { v: 'true', ar: 'تم الصرف', en: 'Paid' },
  ];

  readonly months_ar = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  readonly months_en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  monthName = (m: number) => this.isAr() ? this.months_ar[m - 1] : this.months_en[m - 1];

  ngOnInit() { this.load(1); }

  load(p: number) {
    this.loading.set(true); this.page.set(p);
    const isPaid = this.filterPaid() === '' ? undefined : this.filterPaid() === 'true';
    this.adminSvc.getCompensations(p, 20, isPaid).subscribe(r => {
      if (r.success && r.data) { this.comps.set(r.data.items); this.total.set(r.data.totalCount); this.totalPages.set(r.data.totalPages); }
      this.loading.set(false);
    });
  }

  confirmPay(c: TeacherCompensation) { this.payTarget.set(c); this.payModal.set(true); }
  doPay() {
    this.saving.set(true);
    this.adminSvc.markCompensationPaid(this.payTarget()!.id).subscribe({
      next: r => { this.saving.set(false); this.payModal.set(false); if (r.success) { this.toast.success('تم صرف المكافأة', 'Compensation paid'); this.load(this.page()); } },
      error: () => this.saving.set(false)
    });
  }
}
