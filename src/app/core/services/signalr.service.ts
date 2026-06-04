import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { Notification, ChatMessage } from '../models';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  private readonly storage = inject(StorageService);

  // ── Connection state ─────────────────────────────────────────────
  readonly notifState = signal<ConnectionState>('disconnected');
  readonly chatState  = signal<ConnectionState>('disconnected');

  // ── Observable streams ───────────────────────────────────────────
  private readonly _notification$ = new Subject<Notification>();
  private readonly _chatMessage$  = new Subject<ChatMessage>();

  readonly notification$ = this._notification$.asObservable();
  readonly chatMessage$  = this._chatMessage$.asObservable();

  private notifHub: signalR.HubConnection | null = null;
  private chatHub:  signalR.HubConnection | null = null;

  // Remember which user's JWT each hub was opened with. If the stored token
  // changes (logout → re-login as another user), we MUST drop the old hub
  // and reconnect — otherwise the backend's _currentUser.UserId stays the
  // previous user's, and messages get the wrong SenderId.
  private notifConnectedAs: string | null = null;
  private chatConnectedAs:  string | null = null;

  // ── Notification Hub ─────────────────────────────────────────────
  async connectNotifications(): Promise<void> {
    const token = this.storage.getAccessToken();
    if (this.notifState() === 'connected' && this.notifConnectedAs === token) return;
    if (this.notifHub) { await this.disconnectNotifications(); }

    this.notifHub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.signalrUrl}/hubs/notifications`, {
        accessTokenFactory: () => this.storage.getAccessToken() ?? '',
        transport: signalR.HttpTransportType.WebSockets |
                   signalR.HttpTransportType.ServerSentEvents |
                   signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.notifHub.onreconnecting(() => this.notifState.set('reconnecting'));
    this.notifHub.onreconnected(()   => this.notifState.set('connected'));
    this.notifHub.onclose(()         => this.notifState.set('disconnected'));

    this.notifHub.on('ReceiveNotification', (notif: Notification) => {
      this._notification$.next(notif);
    });

    try {
      this.notifState.set('connecting');
      await this.notifHub.start();
      this.notifState.set('connected');
      this.notifConnectedAs = token;
    } catch {
      this.notifState.set('disconnected');
      this.notifConnectedAs = null;
    }
  }

  async disconnectNotifications(): Promise<void> {
    await this.notifHub?.stop();
    this.notifHub = null;
    this.notifConnectedAs = null;
    this.notifState.set('disconnected');
  }

  // ── Chat Hub ─────────────────────────────────────────────────────
  async connectChat(): Promise<void> {
    const token = this.storage.getAccessToken();
    if (this.chatState() === 'connected' && this.chatConnectedAs === token) return;
    if (this.chatHub) { await this.disconnectChat(); }

    this.chatHub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.signalrUrl}/hubs/chat`, {
        accessTokenFactory: () => this.storage.getAccessToken() ?? '',
        transport: signalR.HttpTransportType.WebSockets |
                   signalR.HttpTransportType.ServerSentEvents |
                   signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.chatHub.onreconnecting(() => this.chatState.set('reconnecting'));
    this.chatHub.onreconnected(()   => this.chatState.set('connected'));
    this.chatHub.onclose(()         => this.chatState.set('disconnected'));

    this.chatHub.on('ReceiveMessage', (msg: ChatMessage) => {
      this._chatMessage$.next(msg);
    });

    try {
      this.chatState.set('connecting');
      await this.chatHub.start();
      this.chatState.set('connected');
      this.chatConnectedAs = token;
    } catch {
      this.chatState.set('disconnected');
      this.chatConnectedAs = null;
    }
  }

  async joinGroup(groupId: string): Promise<void> {
    if (this.chatHub?.state === signalR.HubConnectionState.Connected) {
      await this.chatHub.invoke('JoinGroup', groupId);
    }
  }

  async leaveGroup(groupId: string): Promise<void> {
    if (this.chatHub?.state === signalR.HubConnectionState.Connected) {
      await this.chatHub.invoke('LeaveGroup', groupId);
    }
  }

  async sendMessage(groupId: string, content: string): Promise<void> {
    if (this.chatHub?.state === signalR.HubConnectionState.Connected) {
      await this.chatHub.invoke('SendMessage', groupId, content);
    }
  }

  async disconnectChat(): Promise<void> {
    await this.chatHub?.stop();
    this.chatHub = null;
    this.chatConnectedAs = null;
    this.chatState.set('disconnected');
  }

  ngOnDestroy(): void {
    this.notifHub?.stop();
    this.chatHub?.stop();
    this._notification$.complete();
    this._chatMessage$.complete();
  }
}
