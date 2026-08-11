import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { ChatMessagePage, Conversation, Message } from '../models/message.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(
    private api: ApiService,
    private socketService: SocketService,
  ) {}

  getConversations(): Observable<Conversation[]> {
    return this.api.get<Conversation[]>('/chat/conversations');
  }

  getMessages(otherUserId: string, page = 1, limit = 50): Observable<ChatMessagePage> {
    return this.api.get<ChatMessagePage>(`/chat/${otherUserId}/messages`, { page, limit });
  }

  send(to: string, body: string): Promise<Message> {
    return this.socketService.sendMessage(to, body).catch(() =>
      firstValueFrom(this.api.post<Message>('/chat', { to, body })),
    );
  }

  async markRead(otherUserId: string): Promise<void> {
    try {
      await this.socketService.markConversationRead(otherUserId);
    } catch {
      await firstValueFrom(this.api.put<{ modifiedCount: number }>(`/chat/${otherUserId}/read`));
    }
  }
}