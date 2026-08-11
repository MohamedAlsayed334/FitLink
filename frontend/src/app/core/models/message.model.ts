export interface Message {
  _id: string;
  conversationId: string;
  from: string;
  to: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessagePage {
  messages: Message[];
  total: number;
}

export interface Conversation {
  conversationId: string;
  otherUserId: string;
  otherUserRole: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  lastMessage: {
    body: string;
    createdAt: string;
    from: string;
  } | null;
  unread: number;
  hasMessages?: boolean;
}