import {
  createSupabaseServiceClient,
  isSupabaseConfigured,
} from '@/lib/supabase/service';
import type {
  ChatLocale,
  ChatMessage,
  ConversationMode,
  MessageAuthor,
  MessageRole,
} from './types';

// Data-access layer for conversations/messages. All writes go through the
// service-role client (RLS-bypass) after the caller validates the token.
// Everything degrades to a stateless/ephemeral path when Supabase isn't
// configured, so the widget still works in local preview without a project.

export interface ConversationRow {
  id: string;
  token: string;
  locale: ChatLocale;
  status: string;
  mode: ConversationMode;
  visitor_name: string | null;
  visitor_email: string | null;
}

export async function getRepresentativeOnline(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = createSupabaseServiceClient();
    const {data} = await supabase
      .from('settings')
      .select('representative_online')
      .eq('id', 1)
      .single();
    return Boolean(data?.representative_online);
  } catch {
    return false;
  }
}

export async function createConversation(input: {
  locale: ChatLocale;
  visitorMeta?: Record<string, unknown>;
}): Promise<{
  id: string;
  token: string;
  mode: ConversationMode;
  representativeOnline: boolean;
}> {
  const representativeOnline = await getRepresentativeOnline();

  if (!isSupabaseConfigured()) {
    // Ephemeral (non-persisted) conversation for local preview.
    return {
      id: crypto.randomUUID(),
      token: crypto.randomUUID(),
      mode: 'ai',
      representativeOnline,
    };
  }

  const supabase = createSupabaseServiceClient();
  const {data, error} = await supabase
    .from('conversations')
    .insert({locale: input.locale, visitor_meta: input.visitorMeta ?? {}})
    .select('id,token,mode')
    .single();
  if (error || !data) throw new Error('failed_to_create_conversation');
  return {
    id: data.id,
    token: data.token,
    mode: data.mode as ConversationMode,
    representativeOnline,
  };
}

// Verify a visitor's (id, token) pair. Returns null when it doesn't match — the
// route handlers treat that as unauthorized.
export async function getConversation(
  id: string,
  token: string
): Promise<ConversationRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseServiceClient();
  const {data} = await supabase
    .from('conversations')
    .select('id,token,locale,status,mode,visitor_name,visitor_email')
    .eq('id', id)
    .eq('token', token)
    .maybeSingle();
  return (data as ConversationRow) ?? null;
}

export async function getMessages(
  conversationId: string,
  limit = 100
): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServiceClient();
  const {data} = await supabase
    .from('messages')
    .select('id,role,author,content,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', {ascending: true})
    .limit(limit);
  return (data ?? []).map((m) => ({
    id: m.id,
    role: m.role as MessageRole,
    author: m.author as MessageAuthor,
    content: m.content,
    createdAt: m.created_at,
  }));
}

export async function insertMessage(input: {
  conversationId: string;
  role: MessageRole;
  author: MessageAuthor;
  content: string;
  agentId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseServiceClient();
  const {data} = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      author: input.author,
      content: input.content,
      agent_id: input.agentId ?? null,
      metadata: input.metadata ?? {},
    })
    .select('id,role,author,content,created_at')
    .single();

  // Bump the conversation so the admin inbox re-sorts and re-activates.
  await supabase
    .from('conversations')
    .update({last_message_at: new Date().toISOString(), status: 'active'})
    .eq('id', input.conversationId);

  return data
    ? {
        id: data.id,
        role: data.role as MessageRole,
        author: data.author as MessageAuthor,
        content: data.content,
        createdAt: data.created_at,
      }
    : null;
}

export async function insertLead(input: {
  conversationId?: string | null;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  request: string;
  recommendedPackage?: string;
  aiSummary?: string;
  locale: ChatLocale;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseServiceClient();
  const {data} = await supabase
    .from('leads')
    .insert({
      conversation_id: input.conversationId ?? null,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      company: input.company ?? null,
      request: input.request,
      recommended_package: input.recommendedPackage ?? null,
      ai_summary: input.aiSummary ?? null,
      locale: input.locale,
    })
    .select('id')
    .single();
  // Attach the contact details to the conversation for the admin view.
  if (input.conversationId) {
    await supabase
      .from('conversations')
      .update({visitor_name: input.name, visitor_email: input.email})
      .eq('id', input.conversationId);
  }
  return data?.id ?? null;
}

export async function insertSupportRequest(input: {
  conversationId?: string | null;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  body: string;
  aiSummary?: string;
  locale: ChatLocale;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseServiceClient();
  const {data} = await supabase
    .from('support_requests')
    .insert({
      conversation_id: input.conversationId ?? null,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      subject: input.subject,
      body: input.body,
      ai_summary: input.aiSummary ?? null,
      locale: input.locale,
    })
    .select('id')
    .single();
  return data?.id ?? null;
}
