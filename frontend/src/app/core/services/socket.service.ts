import { Injectable, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Message } from '../models/message.model';
import { AppNotification } from '../models/notification.model';

interface SendAck {
  ok: boolean;
  message?: Message;
  error?: string;
}

interface ReadAck {
  ok: boolean;
  error?: string;
}

interface ReadEvent {
  by: string;
  conversationId: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  private messageSubject = new Subject<Message>();
  message$ = this.messageSubject.asObservable();

  private notificationSubject = new Subject<AppNotification>();
  notification$ = this.notificationSubject.asObservable();

  private readSubject = new Subject<{ by: string; conversationId: string }>();
  read$ = this.readSubject.asObservable();

  private destroy$ = new Subject<void>();

  constructor(private auth: AuthService) {
    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        const token = this.auth.getToken();
        if (token) {
          this.connect(token);
        } else {
          this.disconnect();
        }
      } else {
        this.disconnect();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }

  connect(token: string): void {
    if (this.socket) {
      return;
    }
    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });
    this.socket.on('chat:message', (msg: Message) => this.messageSubject.next(msg));
    this.socket.on('chat:read', (d: ReadEvent) => this.readSubject.next(d));
    this.socket.on('notification:new', (n: AppNotification) => this.notificationSubject.next(n));
    this.socket.on('connect_error', (err: Error) => console.warn('[socket] connect_error', err.message));
  }

  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
  }

  sendMessage(to: string, body: string): Promise<Message> {
    const socket = this.socket;
    if (!socket) {
      return Promise.reject(new Error('Socket not connected'));
    }
    return new Promise<Message>((resolve, reject) => {
      socket.emit('chat:send', { to, body }, (res: SendAck) => {
        if (!res || res.ok !== true) {
          reject(new Error(res?.error || 'Socket not connected'));
          return;
        }
        resolve(res.message as Message);
      });
    });
  }

  markConversationRead(to: string): Promise<void> {
    const socket = this.socket;
    if (!socket) {
      return Promise.reject(new Error('Socket not connected'));
    }
    return new Promise<void>((resolve, reject) => {
      socket.emit('chat:read', { to }, (res: ReadAck) => {
        if (!res || res.ok !== true) {
          reject(new Error(res?.error || 'Socket not connected'));
          return;
        }
        resolve();
      });
    });
  }

  get connected(): boolean {
    return !!this.socket?.connected;
  }
}