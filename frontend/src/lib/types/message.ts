export interface MessageMediaItem {
  id: string;
  type: 'image' | 'video';
  cdnUrl: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  reacted: boolean; // True if the current user reacted with this emoji
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string | null;
  status: 'sent' | 'recalled';
  parentId: string | null;
  parentSenderName: string | null;
  parentContent: string | null;
  media: MessageMediaItem[];
  reactions: ReactionGroup[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string | null;
    senderName: string;
    createdAt: string;
    status: string;
  } | null;
  unreadCount: number;
  isMuted: boolean;
}
