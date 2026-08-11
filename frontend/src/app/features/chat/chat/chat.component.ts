import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Conversation, Message } from '../../../core/models/message.model';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { SocketService } from '../../../core/services/socket.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'fit-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  activeConv: Conversation | null = null;
  messages: Message[] = [];
  body = '';
  loadingConvs = true;
  loadingMsgs = false;
  sending = false;
  errorMessage: string | null = null;
  private deepLinkHandled = false;
  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private socket: SocketService,
    private auth: AuthService,
    private toast: ToastService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.loadConversations();
    this.socket.message$
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg) => this.handleIncomingMessage(msg));
    this.socket.read$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ by, conversationId }) => {
        const conv = this.activeConv;
        if (!conv || by !== conv.otherUserId) {
          return;
        }
        const readAt = new Date().toISOString();
        this.messages = this.messages.map((m) =>
          m.conversationId === conversationId && m.from === conv.otherUserId && !m.readAt
            ? { ...m, readAt }
            : m,
        );
      });
  }

  private handleIncomingMessage(msg: Message): void {
    const me = this.auth.currentUser;
    if (!me) {
      return;
    }
    const myId = me._id;
    const activeConv = this.activeConv;
    if (
      activeConv &&
      (msg.from === activeConv.otherUserId || msg.to === activeConv.otherUserId)
    ) {
      this.upsertMessage(msg);
      this.markReadCurrent();
      return;
    }
    const coachIsSender = me.role === 'coach' ? msg.from === myId : msg.from !== myId;
    const conversationId = coachIsSender ? `${msg.from}_${msg.to}` : `${msg.to}_${msg.from}`;
    const existing = this.conversations.find((c) => c.conversationId === conversationId);
    if (existing) {
      existing.unread += 1;
      existing.hasMessages = true;
      existing.lastMessage = { body: msg.body, createdAt: msg.createdAt, from: msg.from };
      this.conversations = [
        existing,
        ...this.conversations.filter((c) => c !== existing),
      ];
    } else {
      const synthesized: Conversation = {
        conversationId,
        otherUserId: msg.from === myId ? msg.to : msg.from,
        otherUserRole: '',
        firstName: null,
        lastName: null,
        avatar: null,
        lastMessage: { body: msg.body, createdAt: msg.createdAt, from: msg.from },
        unread: 0,
        hasMessages: true,
      };
      this.conversations = [synthesized, ...this.conversations];
    }
  }

  loadConversations(): void {
    this.chatService.getConversations().subscribe({
      next: (list) => {
        const prevActiveId = this.activeConv?.conversationId;
        this.conversations = list;
        if (prevActiveId) {
          this.activeConv =
            list.find((c) => c.conversationId === prevActiveId) || this.activeConv;
        }
        this.loadingConvs = false;
        this.openDeepLink();
      },
      error: (err) => {
        this.loadingConvs = false;
        this.errorMessage = err.message || 'Failed to load conversations';
      },
    });
  }

  private openDeepLink(): void {
    if (this.deepLinkHandled) {
      return;
    }
    const withId = this.route.snapshot.queryParamMap.get('with');
    if (!withId) {
      return;
    }
    this.deepLinkHandled = true;
    const existing = this.conversations.find((c) => c.otherUserId === withId);
    if (existing) {
      this.openConversation(existing);
      return;
    }
    const me = this.auth.currentUser;
    if (!me) {
      return;
    }
    const otherUserRole = me.role === 'coach' ? 'trainee' : 'coach';
    const conversationId =
      me.role === 'coach' ? `${me._id}_${withId}` : `${withId}_${me._id}`;
    const pending: Conversation = {
      conversationId,
      otherUserId: withId,
      otherUserRole,
      firstName: null,
      lastName: null,
      avatar: null,
      lastMessage: null,
      unread: 0,
      hasMessages: false,
    };
    this.conversations = [pending, ...this.conversations];
    this.openConversation(pending);
  }

  openConversation(conv: Conversation): void {
    this.activeConv = conv;
    this.errorMessage = null;
    conv.unread = 0;
    this.loadMessages();
  }

  loadMessages(): void {
    const conv = this.activeConv;
    if (!conv) {
      return;
    }
    this.loadingMsgs = true;
    this.chatService.getMessages(conv.otherUserId, 1, 200).subscribe({
      next: (page) => {
        this.messages = [...page.messages].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        this.loadingMsgs = false;
        this.markReadCurrent();
      },
      error: (err) => {
        this.loadingMsgs = false;
        this.errorMessage = err.message || 'Failed to load messages';
      },
    });
  }

  markReadCurrent(obj = {}): void {
    const conv = this.activeConv;
    if (conv) {
      void this.chatService.markRead(conv.otherUserId).catch(() => undefined);
    }
  }

  send(): void {
    const text = this.body.trim();
    if (!text || !this.activeConv || this.sending) {
      return;
    }
    this.sending = true;
    this.chatService
      .send(this.activeConv.otherUserId, text)
      .then((msg) => {
        this.upsertMessage(msg);
        this.body = '';
        this.sending = false;
        this.toast.success('Message sent');
        this.loadConversations();
      })
      .catch((err) => {
        this.sending = false;
        const message = err?.message || 'Message failed to send';
        this.errorMessage = message;
        this.toast.error(message);
      });
  }

  private upsertMessage(msg: Message): void {
    const exists = this.messages.some((m) => m._id === msg._id);
    if (exists) {
      return;
    }
    this.messages = [...this.messages, msg].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  get emptyStateMessage(): string {
    return this.auth.currentUser?.role === 'coach'
      ? 'No active trainees yet — when a trainee subscribes to you, they will appear here.'
      : 'Chat unlocks after you subscribe to a coach.';
  }

  convName(conv: Conversation): string {
    return `${conv.firstName || ''} ${conv.lastName || ''}`.trim();
  }

  labelFor(conv: Conversation): string {
    return conv.otherUserRole === 'coach'
      ? 'Coach'
      : conv.otherUserRole === 'trainee'
        ? 'Trainee'
        : 'Member';
  }

  shortId(id: string): string {
    return id.slice(-6);
  }

  isMine(msg: Message): boolean {
    return msg.from === this.auth.currentUser?._id;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}