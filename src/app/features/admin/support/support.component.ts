import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupportService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SupportThread, SupportThreadListItem, SupportMessage } from '../../../core/models';

/**
 * Staff inbox for student ⇄ administration threads (used by Admin and Supervisor routes).
 * Supervisors reach this only with the ReplyContactMessages permission (nav-gated + server-enforced).
 */
@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent, PaginationComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? 'دعم الطلاب' : 'Student Support' }}</h1>
          <p class="section-subtitle">
            {{ unread() }} {{ isAr() ? 'غير مقروءة' : 'unread' }} {{ isAr()?'من':'of' }} {{ total() }}
          </p>
        </div>
      </div>

      <div class="row g-4">
        <!-- Threads list -->
        <div [class]="selected() ? 'col-lg-5' : 'col-12'">
          <div class="card">
            <div class="list-group list-group-flush">
              @if (loading()) {
                <div class="p-3"><app-skeleton type="list" [count]="6"/></div>
              } @else {
                @for (t of threads(); track t.id) {
                  <button class="list-group-item list-group-item-action border-0 px-4 py-3"
                          style="text-align:inherit"
                          [style.background]="selected()?.id===t.id ? 'var(--lms-primary-light)' : ''"
                          (click)="open(t)">
                    <div class="d-flex align-items-start gap-3">
                      <div class="avatar flex-shrink-0" style="width:38px;height:38px">{{ (t.studentNameAr || t.studentNameEn || '?').charAt(0) }}</div>
                      <div class="flex-grow-1" style="min-width:0">
                        <div class="d-flex align-items-center justify-content-between mb-1 gap-2">
                          <span class="fw-semibold text-truncate" style="font-size:.85rem">
                            {{ isAr() ? t.studentNameAr : t.studentNameEn }}
                            @if (t.ownerRole === 'Parent') { <span class="badge bg-info-subtle text-info-emphasis ms-1" style="font-size:.6rem">{{ isAr()?'ولي أمر':'Parent' }}</span> }
                          </span>
                          <small class="text-muted flex-shrink-0">{{ t.lastMessageAt | date:'d MMM' }}</small>
                        </div>
                        @if (t.ownerRole === 'Parent' && (t.childStudentNameAr || t.childStudentNameEn)) {
                          <div class="text-primary mb-1" style="font-size:.72rem"><i class="bi bi-person me-1"></i>{{ isAr()?'عن الطالب: ':'About: ' }}{{ isAr()? t.childStudentNameAr : t.childStudentNameEn }}</div>
                        }
                        <p class="mb-0 text-secondary text-truncate" style="font-size:.78rem">
                          <span class="fw-medium">{{ t.subject || (isAr()?'بدون عنوان':'No subject') }}</span>
                          — {{ t.lastMessageFromStaff ? (isAr()?'أنت: ':'You: ') : '' }}{{ t.lastMessagePreview }}
                        </p>
                      </div>
                      <div class="d-flex flex-column align-items-end gap-1 flex-shrink-0">
                        @if (t.hasUnread) {
                          <span class="badge rounded-pill bg-primary" style="font-size:.6rem;padding:4px 7px">{{ isAr()?'جديد':'New' }}</span>
                        }
                        @if (t.status === 'Closed') {
                          <span class="badge rounded-pill bg-secondary" style="font-size:.6rem;padding:4px 7px">{{ isAr()?'مغلق':'Closed' }}</span>
                        }
                      </div>
                    </div>
                  </button>
                }
                @if (!threads().length) {
                  <div class="text-center py-5 text-secondary">
                    <i class="bi bi-inbox d-block mb-2 fs-1 opacity-50"></i>
                    {{ isAr() ? 'لا توجد رسائل' : 'No messages' }}
                  </div>
                }
              }
            </div>
            <app-pagination [currentPage]="page()" [totalPages]="totalPages()"
              [totalCount]="total()" [pageSize]="20" (pageChange)="load($event)"/>
          </div>
        </div>

        <!-- Thread conversation -->
        @if (selected()) {
          <div class="col-lg-7">
            <div class="card d-flex flex-column" style="min-height:480px">
              <div class="card-header py-3 d-flex align-items-center justify-content-between">
                <div style="min-width:0">
                  <div class="fw-semibold text-truncate">
                    {{ isAr() ? thread()?.studentNameAr : thread()?.studentNameEn }}
                    @if (thread()?.ownerRole === 'Parent') {
                      <span class="badge bg-info-subtle text-info-emphasis ms-1" style="font-size:.6rem">{{ isAr()?'ولي أمر':'Parent' }}</span>
                      @if (thread()?.childStudentNameAr || thread()?.childStudentNameEn) {
                        <span class="text-primary ms-1" style="font-size:.78rem">· {{ isAr()?'عن: ':'about: ' }}{{ isAr()? thread()?.childStudentNameAr : thread()?.childStudentNameEn }}</span>
                      }
                    }
                  </div>
                  <small class="text-secondary text-truncate d-block">{{ thread()?.subject || (isAr()?'بدون عنوان':'No subject') }}</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                  @if (thread()) {
                    <button class="btn btn-sm btn-outline-secondary" (click)="toggleStatus()" [disabled]="busy()">
                      {{ thread()!.status === 'Closed' ? (isAr()?'إعادة فتح':'Reopen') : (isAr()?'إغلاق':'Close') }}
                    </button>
                  }
                  <button class="btn btn-sm btn-link text-secondary p-1" (click)="selected.set(null)"><i class="bi bi-x-lg"></i></button>
                </div>
              </div>

              <div class="card-body flex-grow-1" style="overflow-y:auto;max-height:55vh">
                @if (threadLoading()) {
                  <app-skeleton type="list" [count]="4"/>
                } @else {
                  @for (m of thread()?.messages ?? []; track m.id) {
                    <div class="d-flex mb-3" [class.justify-content-end]="m.isFromStaff">
                      <div class="p-3 rounded-3" style="max-width:80%"
                           [style.background]="m.isFromStaff ? 'var(--lms-primary)' : 'var(--surface-2)'"
                           [style.color]="m.isFromStaff ? '#fff' : 'var(--text-main)'"
                           [style.border]="m.isFromStaff ? 'none' : '1px solid var(--border-color)'">
                        <div class="d-flex align-items-center gap-2 mb-1" style="font-size:.7rem;opacity:.85">
                          <strong>{{ senderLabel(m) }}</strong>
                          <span>· {{ m.sentAt | date:'d MMM, h:mm a' }}</span>
                        </div>
                        <div style="font-size:.9rem;line-height:1.6;white-space:pre-wrap">{{ m.body }}</div>
                      </div>
                    </div>
                  }
                }
              </div>

              <div class="card-footer bg-transparent">
                <form [formGroup]="replyForm" (ngSubmit)="reply()" class="d-flex gap-2 align-items-end">
                  <textarea formControlName="body" class="form-control" rows="2"
                            [placeholder]="isAr()?'اكتب ردك...':'Write a reply...'"></textarea>
                  <button type="submit" class="btn btn-primary px-3" [disabled]="busy()">
                    @if (busy()) { <span class="spinner-border spinner-border-sm"></span> }
                    @else { <i class="bi bi-send"></i> }
                  </button>
                </form>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class SupportComponent implements OnInit, OnDestroy {
  private readonly support = inject(SupportService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;
  private routeSub?: Subscription;

  readonly threads = signal<SupportThreadListItem[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly selected = signal<SupportThreadListItem | null>(null);
  readonly thread = signal<SupportThread | null>(null);
  readonly threadLoading = signal(false);
  readonly busy = signal(false);

  unread = () => this.threads().filter(t => t.hasUnread).length;

  replyForm = this.fb.group({
    body: ['', [Validators.required, Validators.maxLength(4000)]],
  });

  /** Staff see the real sender name; the student's own messages show the student's name. */
  senderLabel(m: SupportMessage): string {
    if (m.isFromStaff) {
      const name = this.isAr() ? m.senderNameAr : m.senderNameEn;
      return name || (this.isAr() ? 'الإدارة' : 'Administration');
    }
    return (this.isAr() ? this.thread()?.studentNameAr : this.thread()?.studentNameEn)
      || (this.isAr() ? 'الطالب' : 'Student');
  }

  ngOnInit() {
    this.load(1);
    // Deep-link from a notification: ?thread={id} opens that conversation (also on same-page re-click).
    this.routeSub = this.route.queryParamMap.subscribe(p => {
      const id = p.get('thread');
      if (id && id !== this.selected()?.id) this.openById(id);
    });
  }

  ngOnDestroy() { this.routeSub?.unsubscribe(); }

  /** Open a thread by id (used by notification deep-links); fetches it directly so it works
   *  even if the thread isn't on the current page. */
  openById(id: string) {
    const item = this.threads().find(t => t.id === id);
    if (item) { this.open(item); return; }
    this.selected.set({ id } as SupportThreadListItem);
    this.replyForm.reset();
    this.threadLoading.set(true);
    this.thread.set(null);
    this.support.getThread(id).subscribe({
      next: r => {
        if (r.success && r.data) this.thread.set(r.data);
        this.threadLoading.set(false);
        this.threads.update(ts => ts.map(x => x.id === id ? { ...x, hasUnread: false } : x));
      },
      error: () => this.threadLoading.set(false),
    });
  }

  load(p: number) {
    this.loading.set(true); this.page.set(p);
    this.support.allThreads(p).subscribe({
      next: r => {
        if (r.success && r.data) {
          this.threads.set(r.data.items);
          this.total.set(r.data.totalCount);
          this.totalPages.set(r.data.totalPages);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(t: SupportThreadListItem) {
    this.selected.set(t);
    this.replyForm.reset();
    this.threadLoading.set(true);
    this.thread.set(null);
    this.support.getThread(t.id).subscribe({
      next: r => {
        if (r.success && r.data) this.thread.set(r.data);
        this.threadLoading.set(false);
        this.threads.update(ts => ts.map(x => x.id === t.id ? { ...x, hasUnread: false } : x));
      },
      error: () => this.threadLoading.set(false),
    });
  }

  reply() {
    const t = this.selected();
    if (!t || this.replyForm.invalid) { this.replyForm.markAllAsTouched(); return; }
    this.busy.set(true);
    const body = this.replyForm.value.body!;
    this.support.postMessage(t.id, body).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          this.toast.success('تم إرسال الرد', 'Reply sent');
          this.replyForm.reset();
          this.support.getThread(t.id).subscribe(tr => { if (tr.success && tr.data) this.thread.set(tr.data); });
          this.load(this.page());
        }
      },
      error: () => this.busy.set(false),
    });
  }

  toggleStatus() {
    const th = this.thread();
    if (!th) return;
    const next = th.status === 'Closed' ? 'Open' : 'Closed';
    this.busy.set(true);
    this.support.setStatus(th.id, next).subscribe({
      next: r => {
        this.busy.set(false);
        if (r.success) {
          this.thread.update(x => x ? { ...x, status: next } : x);
          this.threads.update(ts => ts.map(x => x.id === th.id ? { ...x, status: next } : x));
          this.toast.success(next === 'Closed' ? 'تم إغلاق المحادثة' : 'تم إعادة الفتح',
                             next === 'Closed' ? 'Thread closed' : 'Thread reopened');
        }
      },
      error: () => this.busy.set(false),
    });
  }
}
