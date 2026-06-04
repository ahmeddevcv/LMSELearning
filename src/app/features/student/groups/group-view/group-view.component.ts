import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GroupService, SessionService, AssignmentService, VideoService, ChatApiService } from '../../../../core/services/api.services';
import { SignalRService } from '../../../../core/services/signalr.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { Group, Session, Assignment, Video, GroupMember, ChatMessage } from '../../../../core/models';

/**
 * Student Group-View page — central hub for one group.
 * Tabs:
 *   1. Chat       — live group chat (SignalR)
 *   2. Sessions   — upcoming + past
 *   3. Assignments — links to /student/assignments/:id/submit
 *   4. Recordings  — playable videos
 *   5. Members    — see classmates + teacher
 */
@Component({
  selector: 'app-student-group-view',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      @if (loading()) { <app-skeleton type="card"/> }
      @else if (!group()) {
        <div class="card"><div class="card-body text-center py-5 text-secondary">
          {{ isAr() ? 'المجموعة غير موجودة' : 'Group not found' }}
        </div></div>
      } @else {
        <!-- Header -->
        <div class="card mb-4">
          <div class="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h1 class="h4 mb-1">{{ isAr() ? group()!.nameAr : group()!.nameEn }}</h1>
              <div class="text-secondary" style="font-size:.85rem">
                <i class="bi bi-book me-1"></i>{{ isAr() ? group()!.subjectNameAr : group()!.subjectNameEn }}
                <span class="mx-2">·</span>
                <i class="bi bi-person-badge me-1"></i>{{ isAr() ? group()!.teacherNameAr : group()!.teacherNameEn }}
              </div>
            </div>
            @if (group()!.googleMeetLink) {
              <a [href]="group()!.googleMeetLink" target="_blank" class="btn btn-primary">
                <i class="bi bi-camera-video me-1"></i>{{ isAr() ? 'دخول الفصل' : 'Join Class' }}
              </a>
            }
          </div>
        </div>

        <!-- Tabs -->
        <ul class="nav nav-pills mb-3 gap-2">
          @for (t of tabs; track t.id) {
            <li class="nav-item">
              <button class="nav-link" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
                <i class="bi {{ t.icon }} me-1"></i>{{ isAr() ? t.ar : t.en }}
              </button>
            </li>
          }
        </ul>

        <!-- Tab panels -->
        <div class="card">
          <div class="card-body">
            @switch (activeTab()) {
              @case ('chat') {
                <div style="height:calc(100vh - 380px);min-height:380px;display:flex;flex-direction:column">
                  <div class="d-flex align-items-center justify-content-end mb-2 gap-2">
                    <span class="conn-dot" [class]="signalr.chatState()"></span>
                    <small class="text-secondary" style="font-size:.72rem">{{ isAr() ? 'مباشر' : 'Live' }}</small>
                  </div>
                  <div #chatBox class="flex-grow-1 overflow-auto p-3 rounded" style="height:0;background:var(--surface-2)">
                    @if (loadingMsgs()) { <app-skeleton type="list" [count]="5"/> }
                    @else {
                      @for (m of msgs(); track m.id) {
                        <div class="d-flex gap-2 mb-3" [class.flex-row-reverse]="m.senderId===myId()">
                          <div class="avatar flex-shrink-0" style="width:32px;height:32px;font-size:.75rem">{{ m.senderNameAr.charAt(0) }}</div>
                          <div [class]="m.senderId===myId() ? 'd-flex flex-column align-items-end' : 'd-flex flex-column'" style="max-width:70%">
                            @if (m.senderId!==myId()) { <small class="text-secondary mb-1" style="font-size:.7rem">{{ isAr() ? m.senderNameAr : m.senderNameEn }}</small> }
                            <div [class]="m.senderId===myId() ? 'bubble-out' : 'bubble-in'"><p class="mb-0" style="font-size:.875rem">{{ m.content }}</p></div>
                            <small class="text-secondary mt-1" style="font-size:.68rem">{{ m.sentAt | date:'h:mm a' }}</small>
                          </div>
                        </div>
                      }
                      @if (!msgs().length) {
                        <div class="text-center py-5 text-secondary">
                          <i class="bi bi-chat-square-dots d-block mb-2 fs-1 opacity-40"></i>
                          <p style="font-size:.88rem">{{ isAr() ? 'لا توجد رسائل بعد. ابدأ المحادثة!' : 'No messages yet. Start the conversation!' }}</p>
                        </div>
                      }
                    }
                  </div>
                  <div class="pt-3 border-top mt-3">
                    <div class="input-group">
                      <textarea class="form-control" rows="1" style="resize:none"
                                [(ngModel)]="text" [placeholder]="isAr() ? 'اكتب رسالة...' : 'Type a message...'"
                                (keydown.enter)="$event.preventDefault(); send()"></textarea>
                      <button class="btn btn-primary" [disabled]="!text.trim()" (click)="send()">
                        <i class="bi bi-send-fill"></i>
                      </button>
                    </div>
                  </div>
                </div>
              }

              @case ('sessions') {
                @if (sessions().length === 0) {
                  <div class="text-center py-4 text-secondary" style="font-size:.88rem">{{ isAr() ? 'لا توجد حصص' : 'No sessions yet' }}</div>
                } @else {
                  <div class="list-group list-group-flush">
                    @for (s of sessions(); track s.id) {
                      <div class="list-group-item px-0 py-3 d-flex align-items-center justify-content-between gap-3">
                        <div class="flex-grow-1 min-w-0">
                          <div class="d-flex align-items-center gap-2 mb-1">
                            <strong style="font-size:.9rem">{{ isAr() ? s.titleAr : s.titleEn }}</strong>
                            <span class="badge" [class]="sessionBadge(s.status)" style="font-size:.65rem">{{ statusLabel(s.status) }}</span>
                          </div>
                          <small class="text-secondary" style="font-size:.78rem">
                            <i class="bi bi-clock me-1"></i>{{ s.scheduledAt | date:'d MMM, h:mm a' }} · {{ s.durationMinutes }}{{ isAr()?'د':'min' }}
                          </small>
                        </div>
                        @if (s.status === 'Live' && s.meetLink) {
                          <a [href]="s.meetLink" target="_blank" class="btn btn-sm btn-success"><i class="bi bi-play-fill"></i> {{ isAr()?'انضمام':'Join' }}</a>
                        }
                      </div>
                    }
                  </div>
                }
              }

              @case ('assignments') {
                @if (assignments().length === 0) {
                  <div class="text-center py-4 text-secondary" style="font-size:.88rem">{{ isAr() ? 'لا توجد واجبات' : 'No assignments yet' }}</div>
                } @else {
                  <div class="list-group list-group-flush">
                    @for (a of assignments(); track a.id) {
                      <div class="list-group-item px-0 py-3 d-flex align-items-center justify-content-between gap-3">
                        <div class="flex-grow-1 min-w-0">
                          <strong style="font-size:.9rem">{{ isAr() ? a.titleAr : a.titleEn }}</strong>
                          <small class="text-secondary d-block" style="font-size:.78rem">
                            {{ a.totalMarks }} {{ isAr() ? 'درجة' : 'marks' }}
                            @if (a.deadline) { · {{ isAr()?'موعد التسليم: ':'Due ' }}{{ a.deadline | date:'d MMM, h:mm a' }} }
                          </small>
                        </div>
                        <a [routerLink]="['/student/assignments', a.id, 'submit']" class="btn btn-sm btn-primary">
                          <i class="bi bi-pencil-square me-1"></i>{{ isAr()?'فتح':'Open' }}
                        </a>
                      </div>
                    }
                  </div>
                }
              }

              @case ('videos') {
                @if (videos().length === 0) {
                  <div class="text-center py-4 text-secondary" style="font-size:.88rem">{{ isAr() ? 'لا توجد تسجيلات بعد' : 'No recordings yet' }}</div>
                } @else {
                  <div class="row g-3">
                    @for (v of videos(); track v.id) {
                      <div class="col-md-6">
                        <div class="card h-100">
                          <div class="card-body">
                            <h6 class="card-title">{{ isAr() ? (v.titleAr || 'تسجيل') : (v.titleEn || 'Recording') }}</h6>
                            <small class="text-secondary d-block mb-2">{{ v.createdAt | date:'d MMM y' }}</small>
                            <button class="btn btn-sm btn-outline-primary" (click)="playVideo(v.id)">
                              <i class="bi bi-play-fill me-1"></i>{{ isAr() ? 'تشغيل' : 'Play' }}
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              }

              @case ('members') {
                <div class="row g-2">
                  @for (m of members(); track m.userId) {
                    <div class="col-sm-6 col-md-4">
                      <div class="d-flex align-items-center gap-2 p-2 rounded" style="background:var(--surface-2)">
                        <div class="avatar" style="width:34px;height:34px;font-size:.8rem">{{ m.fullNameAr.charAt(0) }}</div>
                        <div class="flex-grow-1 min-w-0">
                          <div class="fw-medium text-truncate" style="font-size:.82rem">{{ isAr() ? m.fullNameAr : m.fullNameEn }}</div>
                          <small class="text-secondary" style="font-size:.7rem">{{ m.role === 'Teacher' ? (isAr()?'معلم':'Teacher') : (isAr()?'طالب':'Student') }}</small>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .nav-pills .nav-link { color: var(--text-secondary); padding: .5rem 1rem; font-size: .85rem; border-radius: 8px; }
    .nav-pills .nav-link.active { background: var(--lms-primary); color: white; }
  `]
})
export class GroupViewComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatBox') private chatBox?: ElementRef<HTMLDivElement>;
  private readonly route      = inject(ActivatedRoute);
  private readonly groupSvc   = inject(GroupService);
  private readonly sessionSvc = inject(SessionService);
  private readonly assignSvc  = inject(AssignmentService);
  private readonly videoSvc   = inject(VideoService);
  private readonly chatApi    = inject(ChatApiService);
  readonly signalr            = inject(SignalRService);
  private readonly auth       = inject(AuthService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  readonly tabs = [
    { id: 'chat' as const,        icon: 'bi-chat-dots',      ar: 'المحادثة',  en: 'Chat' },
    { id: 'sessions' as const,    icon: 'bi-camera-video',   ar: 'الحصص',     en: 'Sessions' },
    { id: 'assignments' as const, icon: 'bi-clipboard-check',ar: 'الواجبات',  en: 'Assignments' },
    { id: 'videos' as const,      icon: 'bi-play-circle',    ar: 'التسجيلات', en: 'Recordings' },
    { id: 'members' as const,     icon: 'bi-people',         ar: 'الأعضاء',   en: 'Members' },
  ];

  readonly group       = signal<Group | null>(null);
  readonly sessions    = signal<Session[]>([]);
  readonly assignments = signal<Assignment[]>([]);
  readonly videos      = signal<Video[]>([]);
  readonly members     = signal<GroupMember[]>([]);
  readonly msgs        = signal<ChatMessage[]>([]);
  readonly loading     = signal(true);
  readonly loadingMsgs = signal(true);
  readonly activeTab   = signal<'chat'|'sessions'|'assignments'|'videos'|'members'>('chat');
  readonly myId        = signal(this.auth.currentUser$()?.id ?? '');
  text = '';

  private gid = '';
  private rxSubs: Subscription[] = [];
  private needsScroll = false;

  ngOnInit() {
    this.gid = this.route.snapshot.params['id'];
    this.groupSvc.getGroupById(this.gid).subscribe(r => {
      if (r.success && r.data) this.group.set(r.data);
      this.loading.set(false);
    });
    this.sessionSvc.getGroupSessions(this.gid).subscribe(r => { if (r.success && r.data) this.sessions.set(r.data); });
    this.assignSvc.getGroupAssignments(this.gid).subscribe(r => { if (r.success && r.data) this.assignments.set(r.data); });
    this.videoSvc.getGroupVideos(this.gid).subscribe(r => { if (r.success && r.data) this.videos.set(r.data); });
    this.groupSvc.getGroupMembers(this.gid).subscribe(r => { if (r.success && r.data) this.members.set(r.data); });

    // Chat: load history + open SignalR hub + subscribe to incoming messages
    this.chatApi.getHistory(this.gid).subscribe(r => {
      if (r.success && r.data) this.msgs.set(r.data.items.reverse());
      this.loadingMsgs.set(false); this.needsScroll = true;
    });
    this.signalr.connectChat().then(() => this.signalr.joinGroup(this.gid));
    this.rxSubs.push(this.signalr.chatMessage$.subscribe(m => {
      if (m.groupId === this.gid) { this.msgs.update(ms => [...ms, m]); this.needsScroll = true; }
    }));
  }

  ngAfterViewChecked() { if (this.needsScroll && this.chatBox) { this.scroll(); this.needsScroll = false; } }
  ngOnDestroy() { this.signalr.leaveGroup(this.gid); this.rxSubs.forEach(s => s.unsubscribe()); }
  send() { if (!this.text.trim()) return; this.signalr.sendMessage(this.gid, this.text.trim()); this.text = ''; }
  private scroll() { try { this.chatBox!.nativeElement.scrollTop = this.chatBox!.nativeElement.scrollHeight; } catch {} }

  playVideo(id: string) {
    this.videoSvc.getStreamUrl(id).subscribe(r => {
      if (r.success && r.data?.streamUrl) window.open(r.data.streamUrl, '_blank');
    });
  }

  sessionBadge(s: string) {
    return s === 'Live' ? 'bg-success' : s === 'Completed' ? 'bg-secondary' : s === 'Cancelled' ? 'bg-danger' : 'bg-primary';
  }
  statusLabel(s: string) {
    const m: Record<string,[string,string]> = { Scheduled:['مجدولة','Scheduled'], Live:['جارية','Live'], Completed:['منتهية','Completed'], Cancelled:['ملغاة','Cancelled'] };
    const [ar, en] = m[s] ?? [s, s];
    return this.isAr() ? ar : en;
  }
}
