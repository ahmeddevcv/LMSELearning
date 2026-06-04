import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupportService } from '../../../core/services/api.services';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { SupportThread, SupportThreadListItem, SupportMessage } from '../../../core/models';

/**
 * Student ⇄ Administration messaging ("تواصل مع الإدارة").
 * The student starts threads and chats with the shared admin inbox; replies arrive in-app.
 * Reuses PUT/POST /api/support endpoints (SupportService).
 */
@Component({
  selector: 'app-student-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header d-flex align-items-center justify-content-between">
        <div>
          <h1 class="section-title">{{ isAr() ? 'تواصل مع الإدارة' : 'Contact Administration' }}</h1>
          <p class="section-subtitle">{{ isAr() ? 'راسل الإدارة وتابع الردود هنا' : 'Message the administration and track replies here' }}</p>
        </div>
        @if (mode() !== 'new') {
          <button class="btn btn-primary" (click)="startNew()">
            <i class="bi bi-plus-lg me-1"></i>{{ isAr() ? 'رسالة جديدة' : 'New Message' }}
          </button>
        }
      </div>

      <div class="row g-4">
        <!-- Threads list -->
        <div [class]="mode() === 'list' ? 'col-12' : 'col-lg-5'">
          <div class="card">
            <div class="list-group list-group-flush">
              @if (loading()) {
                <div class="p-3"><app-skeleton type="list" [count]="5"/></div>
              } @else {
                @for (t of threads(); track t.id) {
                  <button class="list-group-item list-group-item-action border-0 px-4 py-3"
                          style="text-align:inherit"
                          [style.background]="selectedId()===t.id ? 'var(--lms-primary-light)' : ''"
                          (click)="open(t)">
                    <div class="d-flex align-items-start gap-3">
                      <div class="avatar flex-shrink-0" style="width:38px;height:38px"><i class="bi bi-headset"></i></div>
                      <div class="flex-grow-1" style="min-width:0">
                        <div class="d-flex align-items-center justify-content-between mb-1 gap-2">
                          <span class="fw-semibold text-truncate" style="font-size:.85rem">{{ t.subject || (isAr()?'بدون عنوان':'No subject') }}</span>
                          <small class="text-muted flex-shrink-0">{{ t.lastMessageAt | date:'d MMM' }}</small>
                        </div>
                        <p class="mb-0 text-secondary text-truncate" style="font-size:.78rem">
                          {{ t.lastMessageFromStaff ? (isAr()?'الإدارة: ':'Admin: ') : '' }}{{ t.lastMessagePreview }}
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
                    <i class="bi bi-chat-dots d-block mb-2 fs-1 opacity-50"></i>
                    {{ isAr() ? 'لا توجد رسائل بعد — ابدأ محادثة جديدة' : 'No messages yet — start a new conversation' }}
                  </div>
                }
              }
            </div>
          </div>
        </div>

        <!-- New thread composer -->
        @if (mode() === 'new') {
          <div class="col-lg-7">
            <div class="card">
              <div class="card-header py-3 d-flex align-items-center justify-content-between">
                <strong style="font-size:.9rem"><i class="bi bi-pencil-square me-2 text-primary"></i>{{ isAr()?'رسالة جديدة':'New Message' }}</strong>
                <button class="btn btn-sm btn-link text-secondary p-1" (click)="cancelNew()"><i class="bi bi-x-lg"></i></button>
              </div>
              <form [formGroup]="newForm" (ngSubmit)="send()">
                <div class="card-body">
                  <label class="form-label small fw-medium">{{ isAr()?'العنوان (اختياري)':'Subject (optional)'}}</label>
                  <input formControlName="subject" class="form-control mb-3" [placeholder]="isAr()?'مثال: استفسار عن الاشتراك':'e.g. Subscription inquiry'">
                  <label class="form-label small fw-medium">{{ isAr()?'الرسالة':'Message' }}</label>
                  <textarea formControlName="body" class="form-control" rows="6"
                            [placeholder]="isAr()?'اكتب رسالتك هنا...':'Write your message...'"
                            [class.is-invalid]="newForm.get('body')!.invalid && newForm.get('body')!.touched"></textarea>
                </div>
                <div class="card-footer d-flex justify-content-end bg-transparent">
                  <button type="submit" class="btn btn-primary px-4" [disabled]="sending()">
                    @if (sending()) { <span class="spinner-border spinner-border-sm me-1"></span> }
                    <i class="bi bi-send me-1"></i>{{ isAr()?'إرسال':'Send' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        }

        <!-- Thread conversation -->
        @if (mode() === 'thread') {
          <div class="col-lg-7">
            <div class="card d-flex flex-column" style="min-height:480px">
              <div class="card-header py-3 d-flex align-items-center justify-content-between">
                <div style="min-width:0">
                  <div class="fw-semibold text-truncate">{{ thread()?.subject || (isAr()?'محادثة':'Conversation') }}</div>
                  @if (thread()?.status === 'Closed') {
                    <small class="text-secondary">{{ isAr()?'مغلقة — إرسال رسالة يعيد فتحها':'Closed — sending a message reopens it' }}</small>
                  }
                </div>
                <button class="btn btn-sm btn-link text-secondary p-1" (click)="backToList()"><i class="bi bi-x-lg"></i></button>
              </div>

              <div class="card-body flex-grow-1" style="overflow-y:auto;max-height:55vh">
                @if (threadLoading()) {
                  <app-skeleton type="list" [count]="4"/>
                } @else {
                  @for (m of thread()?.messages ?? []; track m.id) {
                    <div class="d-flex mb-3" [class.justify-content-end]="!m.isFromStaff">
                      <div class="p-3 rounded-3" style="max-width:80%"
                           [style.background]="m.isFromStaff ? 'var(--surface-2)' : 'var(--lms-primary)'"
                           [style.color]="m.isFromStaff ? 'var(--text-main)' : '#fff'"
                           [style.border]="m.isFromStaff ? '1px solid var(--border-color)' : 'none'">
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
                  <button type="submit" class="btn btn-primary px-3" [disabled]="sending()">
                    @if (sending()) { <span class="spinner-border spinner-border-sm"></span> }
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
export class StudentContactComponent implements OnInit, OnDestroy {
  private readonly support = inject(SupportService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;
  private routeSub?: Subscription;

  readonly threads = signal<SupportThreadListItem[]>([]);
  readonly loading = signal(true);
  readonly thread = signal<SupportThread | null>(null);
  readonly threadLoading = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly sending = signal(false);
  readonly mode = signal<'list' | 'new' | 'thread'>('list');

  newForm = this.fb.group({
    subject: [''],
    body: ['', [Validators.required, Validators.maxLength(4000)]],
  });
  replyForm = this.fb.group({
    body: ['', [Validators.required, Validators.maxLength(4000)]],
  });

  /** Label shown above a message bubble. Students see staff ROLES, never staff names. */
  senderLabel(m: SupportMessage): string {
    if (!m.isFromStaff) return this.isAr() ? 'أنا' : 'Me';
    if (m.senderRole === 'Admin') return this.isAr() ? 'من المدير' : 'from the Manager';
    if (m.senderRole === 'Supervisor') return this.isAr() ? 'من المشرف' : 'from supervisor';
    return this.isAr() ? 'الإدارة' : 'Administration';
  }

  ngOnInit() {
    this.load();
    // Deep-link from a notification: ?thread={id} opens that conversation.
    this.routeSub = this.route.queryParamMap.subscribe(p => {
      const id = p.get('thread');
      if (id && id !== this.selectedId()) this.openById(id);
    });
  }

  ngOnDestroy() { this.routeSub?.unsubscribe(); }

  /** Open a thread by id (used by notification deep-links). */
  openById(id: string) {
    this.selectedId.set(id);
    this.mode.set('thread');
    this.threadLoading.set(true);
    this.thread.set(null);
    this.support.getMyThread(id).subscribe({
      next: r => {
        if (r.success && r.data) this.thread.set(r.data);
        this.threadLoading.set(false);
        this.threads.update(ts => ts.map(x => x.id === id ? { ...x, hasUnread: false } : x));
        this.auth.getCurrentUser().subscribe();
      },
      error: () => this.threadLoading.set(false),
    });
  }

  load() {
    this.loading.set(true);
    this.support.myThreads().subscribe({
      next: r => { if (r.success && r.data) this.threads.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  startNew() { this.mode.set('new'); this.selectedId.set(null); this.thread.set(null); this.newForm.reset(); }
  cancelNew() { this.mode.set('list'); }
  backToList() { this.mode.set('list'); this.selectedId.set(null); this.thread.set(null); }

  open(t: SupportThreadListItem) {
    this.selectedId.set(t.id);
    this.mode.set('thread');
    this.threadLoading.set(true);
    this.thread.set(null);
    this.support.getMyThread(t.id).subscribe({
      next: r => {
        if (r.success && r.data) this.thread.set(r.data);
        this.threadLoading.set(false);
        // clear the unread dot locally + refresh notification bell
        this.threads.update(ts => ts.map(x => x.id === t.id ? { ...x, hasUnread: false } : x));
        this.auth.getCurrentUser().subscribe();
      },
      error: () => this.threadLoading.set(false),
    });
  }

  send() {
    if (this.newForm.invalid) { this.newForm.markAllAsTouched(); return; }
    this.sending.set(true);
    const { body, subject } = this.newForm.value;
    this.support.createThread(body!, subject || undefined).subscribe({
      next: r => {
        this.sending.set(false);
        if (r.success) {
          this.toast.success('تم إرسال رسالتك', 'Message sent');
          this.mode.set('list');
          this.load();
        }
      },
      error: () => this.sending.set(false),
    });
  }

  reply() {
    const id = this.selectedId();
    if (!id || this.replyForm.invalid) { this.replyForm.markAllAsTouched(); return; }
    this.sending.set(true);
    const body = this.replyForm.value.body!;
    this.support.postMessage(id, body).subscribe({
      next: r => {
        this.sending.set(false);
        if (r.success) {
          this.replyForm.reset();
          // reload the thread to show the new message
          this.support.getMyThread(id).subscribe(tr => { if (tr.success && tr.data) this.thread.set(tr.data); });
          this.load();
        }
      },
      error: () => this.sending.set(false),
    });
  }
}
