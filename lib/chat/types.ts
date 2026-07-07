export type ChatLocale = 'en' | 'ar';

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageAuthor = 'visitor' | 'ai' | 'human_agent';
export type ConversationMode = 'ai' | 'human';

// A message as the widget and admin render it.
export interface ChatMessage {
  id: string;
  role: MessageRole;
  author: MessageAuthor;
  content: string;
  createdAt: string;
}

// Server-Sent Events emitted by POST /api/chat.
export type ChatStreamEvent =
  | {type: 'meta'; conversationId: string; mode: ConversationMode}
  | {type: 'delta'; text: string}
  | {type: 'done'; messageId?: string}
  | {type: 'handoff'; mode: 'human'} // human took over — no AI reply is coming
  | {type: 'error'; message: string};

// A compiled knowledge-base document (source of truth for grounding).
export interface KbDocument {
  ref_key: string;
  title: string;
  body: string;
}
