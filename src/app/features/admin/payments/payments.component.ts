import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, ConfirmModalComponent, PaginationComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'المدفوعات' : 'Payments' }}</h1>
          <p class="section-subtitle">{{ total() }} {{ isAr() ? 'عملية دفع' : 'transactions' }}</p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="row g-3 mb-4 anim-stagger">
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon stat-icon-success"><i class="bi bi-cash-stack fs-4"></i></div>
            <div><div class="stat-label">{{ isAr()?'إجمالي الإيرادات':'Total Revenue' }}</div><div class="stat-value" style="font-size:1.3rem">{{ totalRevenue() | number }} <small style="font-size:.7rem">EGP</small></div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon stat-icon-info"><i class="bi bi-credit-card fs-4"></i></div>
            <div><div class="stat-label">{{ isAr()?'هذا الشهر':'This Month' }}</div><div class="stat-value" style="font-size:1.3rem">{{ monthRevenue() | number }} <small style="font-size:.7rem">EGP</small></div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon stat-icon-warning"><i class="bi bi-receipt fs-4"></i></div>
            <div><div class="stat-label">{{ isAr()?'عدد المعاملات':'Transactions' }}</div><div class="stat-value" style="font-size:1.3rem">{{ total() }}</div></div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div class="stat-icon stat-icon-danger"><i class="bi bi-arrow-return-left fs-4"></i></div>
            <div><div class="stat-label">{{ isAr()?'المسترجعات':'Refunds' }}</div><div class="stat-value" style="font-size:1.3rem">{{ refundCount() }}</div></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover mb-0 table-cards">
            <thead><tr>
              <th>#</th>
              <th>{{ isAr()?'الطالب':'Student' }}</th>
              <th>{{ isAr()?'المادة':'Subject' }}</th>
              <th>{{ isAr()?'المبلغ':'Amount' }}</th>
              <th>{{ isAr()?'طريقة الدفع':'Method' }}</th>
              <th>{{ isAr()?'التاريخ':'Date' }}</th>
              <th>{{ isAr()?'الحالة':'Status' }}</th>
              <th></th>
            </tr></thead>
            <tbody>
              @if (loading()) {
                <app-skeleton type="table" [count]="8" [colCount]="8"/>
              } @else {
                @for (p of payments(); track p.id) {
                  <tr>
                    <td class="text-muted" style="font-size:.75rem" [attr.data-label]="'#'">{{ p.stripePaymentId?.slice(-8) ?? '—' }}</td>
                    <td [attr.data-label]="isAr()?'الطالب':'Student'">
                      <div class="fw-medium" style="font-size:.85rem">{{ isAr()?p.studentNameAr:p.studentNameEn }}</div>
                      <div class="text-secondary" style="font-size:.72rem">{{ p.studentEmail }}</div>
                    </td>
                    <td style="font-size:.82rem" [attr.data-label]="isAr()?'المادة':'Subject'">{{ isAr()?p.subjectNameAr:p.subjectNameEn }}</td>
                    <td class="fw-semibold" style="color:var(--lms-success);font-size:.9rem" [attr.data-label]="isAr()?'المبلغ':'Amount'">{{ p.amount | number }} EGP</td>
                    <td [attr.data-label]="isAr()?'طريقة الدفع':'Method'">
                      <span class="badge badge-info" style="font-size:.72rem">
                        <i class="bi bi-stripe me-1" style="font-size:.8rem"></i>{{ p.provider ?? 'Stripe' }}
                      </span>
                    </td>
                    <td class="text-secondary" style="font-size:.82rem" [attr.data-label]="isAr()?'التاريخ':'Date'">{{ p.createdAt | date:'d MMM y, h:mm a' }}</td>
                    <td [attr.data-label]="isAr()?'الحالة':'Status'">
                      <span class="badge" [class]="p.status==='Succeeded'?'badge-active':p.status==='Refunded'?'badge-warning':'badge-inactive'">
                        {{ isAr()?(p.status==='Succeeded'?'ناجح':p.status==='Refunded'?'مسترجع':'فاشل'):p.status }}
                      </span>
                    </td>
                    <td class="cell-actions">
                      @if (p.status === 'Succeeded') {
                        <button class="btn btn-sm btn-outline-warning" (click)="confirmRefund(p)"
                                title="{{ isAr()?'استرجاع':'Refund' }}">
                          <i class="bi bi-arrow-return-left"></i>
                        </button>
                      }
                    </td>
                  </tr>
                }
                @if (!payments().length) {
                  <tr><td colspan="8" class="cell-empty text-center py-5 text-secondary">
                    <i class="bi bi-receipt d-block mb-2 fs-1 opacity-40"></i>
                    {{ isAr()?'لا توجد مدفوعات':'No payments found' }}
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

    <app-confirm-modal [open]="refundModal()"
      [titleAr]="'استرجاع المبلغ'"
      [titleEn]="'Refund Payment'"
      [messageAr]="'هل تريد استرجاع مبلغ ' + (refundTarget()?.amount ?? 0) + ' EGP من ' + (refundTarget()?.studentNameAr ?? '') + '؟ هذا الإجراء لا يمكن التراجع عنه.'"
      [messageEn]="'Refund ' + (refundTarget()?.amount ?? 0) + ' EGP to ' + (refundTarget()?.studentNameEn ?? '') + '? This action cannot be undone.'"
      [loading]="saving()" (confirm)="doRefund()" (cancelled)="refundModal.set(false)"/>
  `
})
export class PaymentsComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly payments = signal<any[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly totalRevenue = signal(0);
  readonly monthRevenue = signal(0);
  readonly refundCount = signal(0);
  readonly refundModal = signal(false);
  readonly refundTarget = signal<any>(null);

  ngOnInit() { this.load(1); }

  load(p: number) {
    this.loading.set(true); this.page.set(p);
    this.adminSvc.getAllPayments(p, 20).subscribe(r => {
      if (r.success && r.data) {
        this.payments.set(r.data.items);
        this.total.set(r.data.totalCount);
        this.totalPages.set(r.data.totalPages);
        const all: any[] = r.data.items;
        this.totalRevenue.set(all.filter(x => x.status === 'Succeeded').reduce((s: number, x: any) => s + x.amount, 0));
        this.refundCount.set(all.filter(x => x.status === 'Refunded').length);
        const now = new Date();
        this.monthRevenue.set(all.filter((x: any) => {
          const d = new Date(x.createdAt);
          return x.status === 'Succeeded' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).reduce((s: number, x: any) => s + x.amount, 0));
      }
      this.loading.set(false);
    });
  }

  confirmRefund(p: any) { this.refundTarget.set(p); this.refundModal.set(true); }
  doRefund() {
    this.saving.set(true);
    this.adminSvc.refundPayment(this.refundTarget()!.id).subscribe({
      next: r => { this.saving.set(false); this.refundModal.set(false); if (r.success) { this.toast.success('تم الاسترجاع', 'Refunded'); this.load(this.page()); } },
      error: () => this.saving.set(false)
    });
  }
}
