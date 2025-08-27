export interface Message {
  id: string;
  fromUserId: number;
  toUserId: number;
  fromUsername: string;
  toUsername: string;
  body: string;
  createdAt: number;
  readAt?: number;
  productId?: string; // optional context
  attachments?: MessageAttachment[]; // optional file attachments (e.g. images)
  quotedId?: string; // original message id if this is a quote reply
}

export interface ConversationSummary {
  userId: number;
  username: string;
  lastMessage: string;
  lastAt: number;
  unread: number;
  productId?: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  dataUrl: string;
  size: number; // bytes
  type: string; // mime
}
