import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GroupService, SessionService, ChatApiService } from '../../../../core/services/api.services';
import { SignalRService } from '../../../../core/services/signalr.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LanguageService } from '../../../../core/services/language.service';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { Group, GroupMember, Session, ChatMessage } from '../../../../core/models';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent],
  template: `
    <div class="page-fade">
      <div class="section-header">
        <div>
          <h1 class="section-title">{{ isAr() ? group()?.nameAr : group()?.nameEn }}</h1>
          <p class="section-subtitle">{{ group()?.memberCount }} {{ isAr() ? 'طالب' : 'students' }}</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="conn-dot" [class]="signalr.chatState()"></span>
          <small class="text-secondary" style="font-size:.75rem">{{ isAr() ? 'مباشر' : 'Live' }}</small>
        </div>
      </div>
      <ul class="nav nav-tabs mb-4">
        @for (t of tabs; track t.id) {
          <li class="nav-item">
            <button class="nav-link" [class.active]="tab()===t.id" (click)="tab.set(t.id)">
              <i class="bi {{ t.icon }} me-1"></i>{{ isAr() ? t.ar : t.en }}
            </button>
          </li>
        }
      </ul>
      @if (tab()==='chat') {
        <div class="card" style="height:calc(100vh - 340px);min-height:400px;display:flex;flex-direction:column">
          <div #chatBox class="flex-grow-1 overflow-auto p-3" style="height:0">
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
                  <p>{{ isAr() ? 'ابدأ المحادثة!' : 'Start the conversation!' }}</p>
                </div>
              }
            }
          </div>
          <div class="p-3 border-top">
            <div class="input-group">
              <textarea class="form-control border-end-0" rows="1" style="resize:none"
                        [(ngModel)]="text" [placeholder]="isAr() ? 'اكتب رسالة...' : 'Type a message...'"
                        (keydown.enter)="$event.preventDefault(); send()"></textarea>
              <button class="btn btn-primary" [disabled]="!text.trim()" (click)="send()">
                <i class="bi bi-send-fill"></i>
              </button>
            </div>
          </div>
        </div>
      }
      @if (tab()==='members') {
        <div class="card">
          <div class="list-group list-group-flush">
            @if (loadingMembers()) { <div class="p-3"><app-skeleton type="list" [count]="5"/></div> }
            @else {
              @for (m of members(); track m.userId) {
                <div class="list-group-item d-flex align-items-center gap-3 px-4 py-3">
                  <div class="avatar">{{ m.fullNameAr.charAt(0) }}</div>
                  <div class="flex-grow-1">
                    <div class="fw-medium" style="font-size:.875rem">{{ isAr() ? m.fullNameAr : m.fullNameEn }}</div>
                    <div class="text-secondary" style="font-size:.75rem">{{ m.joinedAt | date:'d MMM yyyy' }}</div>
                  </div>
                  <span class="badge" [class]="m.role==='Teacher' ? 'badge-info' : 'badge-inactive'">
                    {{ isAr() ? (m.role==='Teacher' ? 'معلم' : 'طالب') : m.role }}
                  </span>
                  @if (m.role === 'Student') {
                    <button class="btn btn-sm btn-outline-danger ms-2"
                            (click)="removeMember(m)"
                            [title]="isAr() ? 'إزالة من المجموعة' : 'Remove from group'">
                      <i class="bi bi-person-dash"></i>
                    </button>
                  }
                </div>
              }
            }
          </div>
        </div>
      }
      @if (tab()==='sessions') {
        <div class="d-flex flex-column gap-3">
          @if (loadingSessions()) { <app-skeleton type="card" [count]="3"/> }
          @else {
            @for (s of sessions(); track s.id) {
              <div class="card"><div class="card-body d-flex align-items-start gap-3">
                <div class="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                     style="width:48px;height:48px"
                     [style.background]="s.status==='Live'?'#fee2e2':s.status==='Scheduled'?'var(--lms-primary-light)':'var(--surface-3)'">
                  <i class="bi fs-5" [class]="s.status==='Live'?'bi-record-circle-fill text-danger':s.status==='Scheduled'?'bi-calendar3':'bi-play-circle'"
                     [style.color]="s.status==='Scheduled'?'var(--lms-primary)':'inherit'"></i>
                </div>
                <div class="flex-grow-1">
                  <div class="fw-semibold">{{ isAr() ? s.titleAr : s.titleEn }}</div>
                  <div class="text-secondary" style="font-size:.8rem">{{ s.scheduledAt | date:'EEEE d MMM, h:mm a' }}</div>
                </div>
                <div class="d-flex flex-column align-items-end gap-2">
                  <span class="badge" [class]="s.status==='Live'?'badge-live':s.status==='Scheduled'?'badge-scheduled':'badge-inactive'">
                    {{ isAr() ? (s.status==='Live'?'مباشر':s.status==='Scheduled'?'مجدولة':'منتهية') : s.status }}
                  </span>
                  @if (s.meetLink && s.status==='Live') {
                    <a [href]="s.meetLink" target="_blank" class="btn btn-sm btn-danger">{{ isAr() ? 'انضم' : 'Join' }}</a>
                  }
                </div>
              </div></div>
            }
            @if (!sessions().length) {
              <div class="card"><div class="card-body text-center py-5 text-secondary">
                <i class="bi bi-calendar-x d-block mb-2 fs-1 opacity-40"></i>
                {{ isAr() ? 'لا توجد حصص' : 'No sessions' }}
              </div></div>
            }
          }
        </div>
      }
    </div>
  `
})
export class GroupDetailComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatBox') private chatBox!: ElementRef<HTMLDivElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly groupSvc = inject(GroupService);
  private readonly sessionSvc = inject(SessionService);
  private readonly chatApi = inject(ChatApiService);
  readonly signalr = inject(SignalRService);
  private readonly auth = inject(AuthService);
  readonly lang = inject(LanguageService);
  readonly isAr = this.lang.isRtl;

  private gid = '';
  private rxSubs: Subscription[] = [];
  private needsScroll = false;

  readonly group = signal<Group | null>(null);
  readonly members = signal<GroupMember[]>([]);
  readonly sessions = signal<Session[]>([]);
  readonly msgs = signal<ChatMessage[]>([]);
  readonly loadingMembers = signal(true);
  readonly loadingSessions = signal(true);
  readonly loadingMsgs = signal(true);
  readonly tab = signal<'chat'|'members'|'sessions'>('chat');
  readonly myId = signal(this.auth.currentUser$()?.id ?? '');
  text = '';

  readonly tabs = [
    { id:'chat' as const,    ar:'المحادثة', en:'Chat',    icon:'bi-chat-dots' },
    { id:'members' as const, ar:'الأعضاء',  en:'Members', icon:'bi-people' },
    { id:'sessions' as const,ar:'الحصص',   en:'Sessions',icon:'bi-camera-video' },
  ];

  ngOnInit() {
    this.gid = this.route.snapshot.params['id'];
    this.groupSvc.getGroupById(this.gid).subscribe(r => { if (r.success) this.group.set(r.data); });
    this.groupSvc.getGroupMembers(this.gid).subscribe(r => { if (r.success && r.data) this.members.set(r.data); this.loadingMembers.set(false); });
    this.sessionSvc.getGroupSessions(this.gid).subscribe(r => { if (r.success && r.data) this.sessions.set(r.data); this.loadingSessions.set(false); });
    this.chatApi.getHistory(this.gid).subscribe(r => {
      if (r.success && r.data) this.msgs.set(r.data.items.reverse());
      this.loadingMsgs.set(false); this.needsScroll = true;
    });
    this.signalr.connectChat().then(() => this.signalr.joinGroup(this.gid));
    this.rxSubs.push(this.signalr.chatMessage$.subscribe(m => {
      if (m.groupId === this.gid) { this.msgs.update(ms => [...ms, m]); this.needsScroll = true; }
    }));
  }
  ngAfterViewChecked() { if (this.needsScroll) { this.scroll(); this.needsScroll = false; } }
  ngOnDestroy() { this.signalr.leaveGroup(this.gid); this.rxSubs.forEach(s => s.unsubscribe()); }
  send() { if (!this.text.trim()) return; this.signalr.sendMessage(this.gid, this.text.trim()); this.text = ''; }
  private scroll() { try { this.chatBox.nativeElement.scrollTop = this.chatBox.nativeElement.scrollHeight; } catch {} }

  removeMember(m: GroupMember) {
    const name = this.isAr() ? m.fullNameAr : m.fullNameEn;
    if (!confirm(this.isAr() ? `إزالة ${name} من المجموعة؟` : `Remove ${name} from this group?`)) return;
    this.groupSvc.removeMember(this.gid, m.userId).subscribe(r => {
      if (r.success) {
        this.members.update(arr => arr.filter(x => x.userId !== m.userId));
      }
    });
  }
}
