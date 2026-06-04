import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminSubscription, SubscriptionStatus } from '../../../core/models';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

type FilterStatus = 'All' | SubscriptionStatus;

const EXTEND_OPTIONS = [1, 2, 3, 6, 12];

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmModalComponent],
  template: `
    <div class="page-fade">

      <!-- ── Header ──────────────────────────────────────────────── -->
      <div class="section-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h1 class="section-title">{{ isAr() ? 'الاشتراكات' : 'Subscriptions' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'إدارة كل الاشتراكات وتمديدها أو إلغائها' : 'Manage, extend or cancel subscriptions' }}</p>
        </div>
      </div>

      <!-- ── Filter Bar ──────────────────────────────────────────── -->
      <div class="card border-0 shadow-sm mb-3 p-3">
        <div class="d-flex gap-2 flex-wrap align-items-center">
          <span class="fw-semibold me-1">{{ isAr() ? 'الحالة:' : 'Status:' }}</span>
          @for (f of filterOptions; track f.value) {
            <button class="btn btn-sm"
              [class.btn-primary]="activeFilter() === f.value"
              [class.btn-outline-secondary]="activeFilter() !== f.value"
              (click)="setFilter(f.value)">
              {{ isAr() ? f.ar : f.en }}
            </button>
          }
          <div class="ms-auto d-flex align-items-center gap-2">
            <span class="text-secondary small">
              {{ isAr() ? 'الإجمالي:' : 'Total:' }} <strong>{{ totalCount() }}</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- ── Table ───────────────────────────────────────────────── -->
      <div class="card shadow-sm border-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0 table-cards">
            <thead class="table-light">
              <tr>
                <th>{{ isAr() ? 'الطالب' : 'Student' }}</th>
                <th>{{ isAr() ? 'المادة' : 'Subject' }}</th>
                <th>{{ isAr() ? 'النوع' : 'Type' }}</th>
                <th>{{ isAr() ? 'الخطة' : 'Plan' }}</th>
                <th>{{ isAr() ? 'المبلغ' : 'Amount' }}</th>
                <th>{{ isAr() ? 'تاريخ البداية' : 'Start' }}</th>
                <th>{{ isAr() ? 'تاريخ الانتهاء' : 'End' }}</th>
                <th>{{ isAr() ? 'الحالة' : 'Status' }}</th>
                <th style="width:110px">{{ isAr() ? 'إجراءات' : 'Actions' }}</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr><td colspan="9" class="cell-empty text-center py-5"><span class="spinner-border text-primary"></span></td></tr>
              } @else if (!subscriptions().length) {
                <tr><td colspan="9" class="cell-empty text-center py-5 text-secondary">
                  <i class="bi bi-inbox d-block mb-2 fs-2 opacity-40"></i>
                  {{ isAr() ? 'لا توجد اشتراكات' : 'No subscriptions found' }}
                </td></tr>
              } @else {
                @for (s of subscriptions(); track s.id) {
                  <tr>
                    <td [attr.data-label]="isAr() ? 'الطالب' : 'Student'">
                      <div class="fw-semibold">{{ isAr() ? s.studentNameAr : s.studentNameEn }}</div>
                    </td>
                    <td [attr.data-label]="isAr() ? 'المادة' : 'Subject'">
                      <div class="small">{{ isAr() ? s.subjectNameAr : s.subjectNameEn }}</div>
                    </td>
                    <td [attr.data-label]="isAr() ? 'النوع' : 'Type'">
                      @if (s.isFreeGrant) {
                        <span class="badge bg-success bg-opacity-10 text-success">{{ isAr() ? 'مجاني' : 'Free' }}</span>
                      } @else {
                        <span class="badge bg-primary bg-opacity-10 text-primary">{{ isAr() ? 'مدفوع' : 'Paid' }}</span>
                      }
                    </td>
                    <td [attr.data-label]="isAr() ? 'الخطة' : 'Plan'">
                      <span class="badge bg-secondary bg-opacity-10 text-secondary">
                        {{ planLabel(s.planType) }}
                      </span>
                    </td>
                    <td dir="ltr" class="fw-semibold" [attr.data-label]="isAr() ? 'المبلغ' : 'Amount'">
                      @if (s.isFreeGrant) { — }
                      @else { {{ s.amount | number:'1.0-0' }} {{ s.currency }} }
                    </td>
                    <td class="small text-secondary" [attr.data-label]="isAr() ? 'تاريخ البداية' : 'Start'">{{ s.startDate | date:'dd/MM/yyyy' }}</td>
                    <td class="small" [class.text-danger]="isExpiringSoon(s.endDate)" [class.fw-bold]="isExpiringSoon(s.endDate)" [attr.data-label]="isAr() ? 'تاريخ الانتهاء' : 'End'">
                      {{ s.endDate | date:'dd/MM/yyyy' }}
                    </td>
                    <td [attr.data-label]="isAr() ? 'الحالة' : 'Status'">
                      <span class="badge px-2 py-1" [ngClass]="statusClass(s.status)">
                        {{ statusLabel(s.status) }}
                      </span>
                    </td>
                    <td class="cell-actions">
                      <div class="d-flex gap-1">
                        <!-- Extend -->
                        <button class="btn btn-sm btn-outline-success" (click)="openExtend(s)"
                          [title]="isAr() ? 'تمديد' : 'Extend'">
                          <i class="bi bi-calendar-plus"></i>
                        </button>
                        <!-- Revoke -->
                        @if (s.status !== 'Cancelled') {
                          <button class="btn btn-sm btn-outline-danger" (click)="confirmRevoke(s)"
                            [title]="isAr() ? 'إلغاء' : 'Cancel'">
                            <i class="bi bi-x-circle"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="card-footer d-flex justify-content-between align-items-center">
            <button class="btn btn-sm btn-outline-secondary" [disabled]="page() === 1" (click)="changePage(page() - 1)">
              <i class="bi bi-chevron-{{ isAr() ? 'right' : 'left' }}"></i>
            </button>
            <span class="small text-secondary">{{ page() }} / {{ totalPages() }}</span>
            <button class="btn btn-sm btn-outline-secondary" [disabled]="page() === totalPages()" (click)="changePage(page() + 1)">
              <i class="bi bi-chevron-{{ isAr() ? 'left' : 'right' }}"></i>
            </button>
          </div>
        }
      </div>
    </div>

    <!-- ══════════════ Extend Modal ══════════════ -->
    @if (showExtend()) {
      <div class="modal-backdrop fade show" style="z-index:1055"></div>
      <div class="modal fade show d-block" style="z-index:1056" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                {{ isAr() ? 'تمديد الاشتراك' : 'Extend Subscription' }}
              </h5>
              <button type="button" class="btn-close" (click)="closeExtend()"></button>
            </div>
            <div class="modal-body">
              <p class="text-secondary mb-1 small">{{ isAr() ? 'الطالب:' : 'Student:' }}
                <strong>{{ isAr() ? extendTarget()?.studentNameAr : extendTarget()?.studentNameEn }}</strong>
              </p>
              <p class="text-secondary mb-3 small">{{ isAr() ? 'المادة:' : 'Subject:' }}
                <strong>{{ isAr() ? extendTarget()?.subjectNameAr : extendTarget()?.subjectNameEn }}</strong>
              </p>
              <p class="text-secondary mb-1 small">{{ isAr() ? 'تاريخ الانتهاء الحالي:' : 'Current end date:' }}
                <strong>{{ extendTarget()?.endDate | date:'dd/MM/yyyy' }}</strong>
              </p>
              <label class="form-label fw-semibold mt-3">{{ isAr() ? 'عدد أشهر التمديد:' : 'Extend by (months):' }}</label>
              <div class="d-flex flex-wrap gap-2 mt-1">
                @for (m of extendOptions; track m) {
                  <button class="btn"
                    [class.btn-primary]="selectedMonths() === m"
                    [class.btn-outline-secondary]="selectedMonths() !== m"
                    (click)="selectedMonths.set(m)">
                    {{ m }} {{ isAr() ? 'شهر' : (m === 1 ? 'month' : 'months') }}
                  </button>
                }
              </div>
              @if (extendTarget()) {
                <div class="alert alert-info mt-3 mb-0 small">
                  <i class="bi bi-info-circle me-1"></i>
                  {{ isAr() ? 'سينتهي الاشتراك في:' : 'New end date:' }}
                  <strong>{{ calcNewEndDate(extendTarget()!.endDate, selectedMonths()) | date:'dd/MM/yyyy' }}</strong>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" (click)="closeExtend()">
                {{ isAr() ? 'إلغاء' : 'Cancel' }}
              </button>
              <button type="button" class="btn btn-success" [disabled]="saving()" (click)="doExtend()">
                @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                {{ isAr() ? 'تمديد' : 'Extend' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ══════════════ Confirm Revoke ══════════════ -->
    <app-confirm-modal
      [open]="revokeModal()"
      [titleAr]="'إلغاء الاشتراك'"
      [titleEn]="'Cancel Subscription'"
      [messageAr]="'هل تريد إلغاء اشتراك ' + (revokeTarget()?.studentNameAr ?? '') + ' في ' + (revokeTarget()?.subjectNameAr ?? '') + '؟'"
      [messageEn]="'Cancel the subscription of ' + (revokeTarget()?.studentNameEn ?? '') + ' to ' + (revokeTarget()?.subjectNameEn ?? '') + '?'"
      [loading]="saving()"
      (confirm)="doRevoke()"
      (cancelled)="revokeModal.set(false)" />
  `
})
export class AdminSubscriptionsComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast    = inject(ToastService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly subscriptions = signal<AdminSubscription[]>([]);
  readonly loading       = signal(true);
  readonly saving        = signal(false);

  // Pagination
  readonly page        = signal(1);
  readonly totalCount  = signal(0);
  readonly totalPages  = signal(1);
  readonly pageSize    = 20;

  // Filter
  readonly activeFilter = signal<FilterStatus>('All');
  readonly filterOptions: { value: FilterStatus; ar: string; en: string }[] = [
    { value: 'All',       ar: 'الكل',     en: 'All'       },
    { value: 'Active',    ar: 'نشط',      en: 'Active'    },
    { value: 'Expired',   ar: 'منتهي',    en: 'Expired'   },
    { value: 'Cancelled', ar: 'ملغى',     en: 'Cancelled' },
    { value: 'Pending',   ar: 'معلق',     en: 'Pending'   },
  ];

  // Extend modal
  readonly showExtend     = signal(false);
  readonly extendTarget   = signal<AdminSubscription | null>(null);
  readonly selectedMonths = signal(1);
  readonly extendOptions  = EXTEND_OPTIONS;

  // Revoke confirm modal
  readonly revokeModal  = signal(false);
  readonly revokeTarget = signal<AdminSubscription | null>(null);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const statusFilter = this.activeFilter() === 'All' ? undefined : this.activeFilter();
    this.adminSvc.getAllSubscriptions(this.page(), this.pageSize, statusFilter).subscribe({
      next: r => {
        if (r.success && r.data) {
          this.subscriptions.set(r.data.items);
          this.totalCount.set(r.data.totalCount);
          this.totalPages.set(r.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setFilter(f: FilterStatus) {
    this.activeFilter.set(f);
    this.page.set(1);
    this.load();
  }

  changePage(p: number) {
    this.page.set(p);
    this.load();
  }

  // ── Extend ──────────────────────────────────────────────────────────────────

  openExtend(s: AdminSubscription) {
    this.extendTarget.set(s);
    this.selectedMonths.set(1);
    this.showExtend.set(true);
  }

  closeExtend() {
    this.showExtend.set(false);
    this.extendTarget.set(null);
  }

  calcNewEndDate(endDate: string, months: number): Date {
    const base = new Date(endDate);
    const today = new Date();
    const from  = base > today ? base : today;
    const result = new Date(from);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  doExtend() {
    const target = this.extendTarget();
    if (!target) return;
    this.saving.set(true);
    this.adminSvc.extendSubscription(target.id, this.selectedMonths()).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.toast.success('تم التمديد', `Extended by ${this.selectedMonths()} month(s)`);
          this.closeExtend();
          this.load();
        }
      },
      error: () => this.saving.set(false)
    });
  }

  // ── Revoke ──────────────────────────────────────────────────────────────────

  confirmRevoke(s: AdminSubscription) {
    this.revokeTarget.set(s);
    this.revokeModal.set(true);
  }

  doRevoke() {
    const target = this.revokeTarget();
    if (!target) return;
    this.saving.set(true);
    this.adminSvc.revokeSubscription(target.id).subscribe({
      next: r => {
        this.saving.set(false);
        this.revokeModal.set(false);
        if (r.success) {
          this.toast.success('تم الإلغاء', 'Subscription cancelled');
          this.load();
        }
      },
      error: () => { this.saving.set(false); this.revokeModal.set(false); }
    });
  }

  // ── Display helpers ──────────────────────────────────────────────────────────

  statusClass(status: string): string {
    switch (status) {
      case 'Active':    return 'bg-success bg-opacity-10 text-success';
      case 'Expired':   return 'bg-warning bg-opacity-10 text-warning';
      case 'Cancelled': return 'bg-danger  bg-opacity-10 text-danger';
      case 'Pending':   return 'bg-secondary bg-opacity-10 text-secondary';
      default:          return 'bg-secondary bg-opacity-10 text-secondary';
    }
  }

  statusLabel(status: string): string {
    if (this.isAr()) {
      const map: Record<string, string> = { Active: 'نشط', Expired: 'منتهي', Cancelled: 'ملغى', Pending: 'معلق' };
      return map[status] ?? status;
    }
    return status;
  }

  planLabel(plan: string): string {
    if (this.isAr()) {
      const map: Record<string, string> = { Monthly: 'شهري', Semester: 'فصلي', Yearly: 'سنوي' };
      return map[plan] ?? plan;
    }
    return plan;
  }

  isExpiringSoon(endDate: string): boolean {
    const days = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  }
}
