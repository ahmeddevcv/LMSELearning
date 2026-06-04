import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ContactMessage } from '../../../core/models';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent, PaginationComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'رسائل التواصل' : 'Contact Messages' }}</h1>
          <p class="section-subtitle">
            {{ unreadCount() }} {{ isAr() ? 'رسالة غير مقروءة' : 'unread' }}
            من {{ total() }} {{ isAr() ? 'رسالة' : 'total' }}
          </p>
        </div>
      </div>

      <div class="row g-4">
        <!-- List -->
        <div [class]="selected() ? 'col-lg-5' : 'col-12'">
          <div class="card">
            <div class="list-group list-group-flush">
              @if (loading()) {
                <div class="p-3"><app-skeleton type="list" [count]="6"/></div>
              } @else {
                @for (m of messages(); track m.id) {
                  <button class="list-group-item list-group-item-action border-0 px-4 py-3"
                          style="text-align:inherit"
                          [class.active]="selected()?.id === m.id"
                          [style.background]="selected()?.id===m.id?'var(--lms-primary-light)':''"
                          (click)="select(m)">
                    <div class="d-flex align-items-start gap-3">
                      <div class="avatar flex-shrink-0" style="width:38px;height:38px">{{ m.name.charAt(0) }}</div>
                      <div class="flex-grow-1 min-w-0">
                        <div class="d-flex align-items-center justify-content-between mb-1">
                          <span class="fw-semibold" style="font-size:.85rem">{{ m.name }}</span>
                          <small class="text-muted flex-shrink-0 ms-2">{{ m.createdAt | date:'d MMM' }}</small>
                        </div>
                        <p class="mb-0 text-secondary" style="font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                          {{ m.messageText }}
                        </p>
                      </div>
                      @if (!m.isRead) {
                        <span class="badge rounded-pill bg-primary flex-shrink-0" style="font-size:.6rem;padding:4px 7px">جديد</span>
                      }
                    </div>
                  </button>
                }
                @if (!messages().length) {
                  <div class="text-center py-5 text-secondary">
                    <i class="bi bi-inbox d-block mb-2 fs-1 opacity-40"></i>
                    {{ isAr()?'لا توجد رسائل':'No messages' }}
                  </div>
                }
              }
            </div>
            <app-pagination [currentPage]="page()" [totalPages]="totalPages()"
              [totalCount]="total()" [pageSize]="20" (pageChange)="load($event)"/>
          </div>
        </div>

        <!-- Detail -->
        @if (selected()) {
          <div class="col-lg-7">
            <div class="card">
              <div class="card-header py-3 d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-3">
                  <div class="avatar">{{ selected()!.name.charAt(0) }}</div>
                  <div>
                    <div class="fw-semibold">{{ selected()!.name }}</div>
                    <div class="text-secondary" style="font-size:.75rem">{{ selected()!.email }}</div>
                  </div>
                </div>
                <button class="btn btn-sm btn-link text-secondary p-1" (click)="selected.set(null)">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
              <div class="card-body">
                <!-- Meta -->
                <div class="d-flex gap-3 mb-3" style="font-size:.78rem;color:var(--text-muted)">
                  @if (selected()!.phone) {
                    <span><i class="bi bi-telephone me-1"></i>{{ selected()!.phone }}</span>
                  }
                  <span><i class="bi bi-clock me-1"></i>{{ selected()!.createdAt | date:'d MMM y, h:mm a' }}</span>
                </div>
                <!-- Message -->
                <div class="p-3 rounded-3 mb-4" style="background:var(--surface-2);border:1px solid var(--border-color)">
                  <p class="mb-0" style="font-size:.9rem;line-height:1.7">{{ selected()!.messageText }}</p>
                </div>

                <!-- Reply -->
                @if (selected()!.repliedAt) {
                  <div class="d-flex align-items-center gap-2 mb-3" style="color:var(--lms-success);font-size:.82rem">
                    <i class="bi bi-check-circle-fill"></i>
                    {{ isAr()?'تم الرد في ':'Replied on ' }}{{ selected()!.repliedAt | date:'d MMM y' }}
                  </div>
                } @else {
                  <form [formGroup]="replyForm" (ngSubmit)="sendReply()">
                    <label class="form-label small fw-medium">{{ isAr()?'الرد':'Reply' }}</label>
                    <textarea formControlName="replyText" class="form-control mb-3" rows="4"
                              [placeholder]="isAr()?'اكتب ردك هنا...':'Write your reply...'"
                              [class.is-invalid]="replyForm.get('replyText')!.invalid&&replyForm.get('replyText')!.touched">
                    </textarea>
                    <button type="submit" class="btn btn-primary" [disabled]="saving()">
                      @if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                      <i class="bi bi-send me-1"></i>
                      {{ isAr()?'إرسال الرد':'Send Reply' }}
                    </button>
                  </form>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ContactComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly messages = signal<ContactMessage[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly selected = signal<ContactMessage | null>(null);

  unreadCount = () => this.messages().filter(m => !m.isRead).length;

  replyForm = this.fb.group({
    replyText: ['', [Validators.required, Validators.minLength(10)]]
  });

  ngOnInit() { this.load(1); }

  load(p: number) {
    this.loading.set(true); this.page.set(p);
    this.adminSvc.getContactMessages(p).subscribe(r => {
      if (r.success && r.data) { this.messages.set(r.data.items); this.total.set(r.data.totalCount); this.totalPages.set(r.data.totalPages); }
      this.loading.set(false);
    });
  }

  select(m: ContactMessage) {
    this.selected.set(m); this.replyForm.reset();
    // Auto-mark as read when admin opens an unread message
    if (!m.isRead) {
      this.adminSvc.markContactRead(m.id).subscribe(r => {
        if (r.success) {
          this.messages.update(ms => ms.map(x => x.id === m.id ? { ...x, isRead: true } : x));
          this.selected.update(s => s && s.id === m.id ? { ...s, isRead: true } : s);
        }
      });
    }
  }

  sendReply() {
    if (this.replyForm.invalid) { this.replyForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.adminSvc.replyContact(this.selected()!.id, this.replyForm.value.replyText!).subscribe({
      next: r => {
        this.saving.set(false);
        if (r.success) {
          this.toast.success('تم الرد', 'Reply sent');
          this.replyForm.reset();
          // Update local state
          this.messages.update(ms => ms.map(m => m.id === this.selected()!.id ? { ...m, repliedAt: new Date().toISOString(), isRead: true } : m));
          this.selected.update(m => m ? { ...m, repliedAt: new Date().toISOString() } : null);
        }
      },
      error: () => this.saving.set(false)
    });
  }
}
