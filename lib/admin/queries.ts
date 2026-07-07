import {
  createSupabaseServiceClient,
  isSupabaseConfigured,
} from '@/lib/supabase/service';
import {getMessages, insertMessage} from '@/lib/chat/store';
import type {ChatMessage} from '@/lib/chat/types';

export interface AdminConversationRow {
  id: string;
  locale: string;
  status: string;
  mode: string;
  visitor_name: string | null;
  visitor_email: string | null;
  last_message_at: string;
  created_at: string;
  token?: string | null;
}

export async function listConversations(opts: {
  status?: string;
  q?: string;
  limit?: number;
}): Promise<AdminConversationRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from('conversations')
    .select(
      'id,locale,status,mode,visitor_name,visitor_email,last_message_at,created_at'
    )
    .order('last_message_at', {ascending: false})
    .limit(opts.limit ?? 100);

  if (opts.status && opts.status !== 'all') query = query.eq('status', opts.status);
  if (opts.q) {
    query = query.or(
      `visitor_name.ilike.%${opts.q}%,visitor_email.ilike.%${opts.q}%`
    );
  }
  const {data} = await query;
  return (data ?? []) as AdminConversationRow[];
}

export async function getConversationDetail(id: string): Promise<{
  conversation: AdminConversationRow;
  messages: ChatMessage[];
  lead: Record<string, unknown> | null;
  support: Record<string, unknown> | null;
} | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseServiceClient();
  const {data: conversation} = await supabase
    .from('conversations')
    .select(
      'id,locale,status,mode,visitor_name,visitor_email,last_message_at,created_at,token'
    )
    .eq('id', id)
    .maybeSingle();
  if (!conversation) return null;

  const messages = await getMessages(id, 500);
  const {data: lead} = await supabase
    .from('leads')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', {ascending: false})
    .maybeSingle();
  const {data: support} = await supabase
    .from('support_requests')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', {ascending: false})
    .maybeSingle();

  return {
    conversation: conversation as AdminConversationRow,
    messages,
    lead: (lead as Record<string, unknown>) ?? null,
    support: (support as Record<string, unknown>) ?? null,
  };
}

// Close conversations whose last message is older than `minutes`. Idempotent —
// a new message re-activates the conversation (insertMessage sets status back to
// 'active'). Returns how many were closed.
export async function closeStaleConversations(minutes = 15): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = createSupabaseServiceClient();
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const {data, error} = await supabase
    .from('conversations')
    .update({status: 'closed'})
    .neq('status', 'closed')
    .lt('last_message_at', cutoff)
    .select('id');
  if (error) return 0;
  return data?.length ?? 0;
}

export async function getConversationToken(id: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseServiceClient();
  const {data} = await supabase
    .from('conversations')
    .select('token')
    .eq('id', id)
    .maybeSingle();
  return (data?.token as string) ?? null;
}

export async function sendHumanMessage(
  conversationId: string,
  agentId: string,
  content: string
): Promise<ChatMessage | null> {
  return insertMessage({
    conversationId,
    role: 'assistant',
    author: 'human_agent',
    content,
    agentId,
  });
}

export async function setConversationMode(
  conversationId: string,
  mode: 'ai' | 'human',
  agentId: string | null
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createSupabaseServiceClient();
  await supabase
    .from('conversations')
    .update({mode, taken_over_by: mode === 'human' ? agentId : null})
    .eq('id', conversationId);
}

export async function setConversationStatus(
  conversationId: string,
  status: 'active' | 'idle' | 'closed'
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createSupabaseServiceClient();
  await supabase.from('conversations').update({status}).eq('id', conversationId);
}

export async function getSettings(): Promise<{representative_online: boolean}> {
  if (!isSupabaseConfigured()) return {representative_online: false};
  const supabase = createSupabaseServiceClient();
  const {data} = await supabase
    .from('settings')
    .select('representative_online')
    .eq('id', 1)
    .maybeSingle();
  return {representative_online: Boolean(data?.representative_online)};
}

export async function setOnline(online: boolean, agentId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createSupabaseServiceClient();
  await supabase
    .from('settings')
    .update({representative_online: online, updated_by: agentId})
    .eq('id', 1);
}

export async function listLeads(status?: string): Promise<Record<string, unknown>[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', {ascending: false})
    .limit(200);
  if (status && status !== 'all') query = query.eq('status', status);
  const {data} = await query;
  return (data ?? []) as Record<string, unknown>[];
}

export async function updateLeadStatus(id: string, status: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createSupabaseServiceClient();
  await supabase.from('leads').update({status}).eq('id', id);
}

export async function listSupport(
  status?: string
): Promise<Record<string, unknown>[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from('support_requests')
    .select('*')
    .order('created_at', {ascending: false})
    .limit(200);
  if (status && status !== 'all') query = query.eq('status', status);
  const {data} = await query;
  return (data ?? []) as Record<string, unknown>[];
}

export async function updateSupportStatus(
  id: string,
  status: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createSupabaseServiceClient();
  await supabase.from('support_requests').update({status}).eq('id', id);
}

export async function dashboardStats(): Promise<{
  conversations: number;
  activeConversations: number;
  leads: number;
  openSupport: number;
  online: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return {
      conversations: 0,
      activeConversations: 0,
      leads: 0,
      openSupport: 0,
      online: false,
    };
  }
  const supabase = createSupabaseServiceClient();

  const [conv, active, leadsRes, support, settings] = await Promise.all([
    supabase.from('conversations').select('id', {count: 'exact', head: true}),
    supabase
      .from('conversations')
      .select('id', {count: 'exact', head: true})
      .eq('status', 'active'),
    supabase.from('leads').select('id', {count: 'exact', head: true}),
    supabase
      .from('support_requests')
      .select('id', {count: 'exact', head: true})
      .eq('status', 'open'),
    getSettings(),
  ]);

  return {
    conversations: conv.count ?? 0,
    activeConversations: active.count ?? 0,
    leads: leadsRes.count ?? 0,
    openSupport: support.count ?? 0,
    online: settings.representative_online,
  };
}

export interface Analytics {
  languageSplit: {locale: string; count: number}[];
  takeoverRate: number;
  totalMessages: number;
  recentQuestions: {content: string; created_at: string}[];
}

export async function getAnalytics(): Promise<Analytics> {
  if (!isSupabaseConfigured()) {
    return {languageSplit: [], takeoverRate: 0, totalMessages: 0, recentQuestions: []};
  }
  const supabase = createSupabaseServiceClient();

  const {data: convs} = await supabase.from('conversations').select('locale');
  const split = new Map<string, number>();
  (convs ?? []).forEach((c: {locale: string}) =>
    split.set(c.locale, (split.get(c.locale) ?? 0) + 1)
  );
  const languageSplit = [...split.entries()].map(([locale, count]) => ({
    locale,
    count,
  }));
  const totalConvs = convs?.length ?? 0;

  const [{count: takeovers}, {count: totalMessages}, {data: questions}] =
    await Promise.all([
      supabase
        .from('analytics_events')
        .select('id', {count: 'exact', head: true})
        .eq('type', 'takeover'),
      supabase.from('messages').select('id', {count: 'exact', head: true}),
      supabase
        .from('messages')
        .select('content,created_at')
        .eq('role', 'user')
        .order('created_at', {ascending: false})
        .limit(10),
    ]);

  return {
    languageSplit,
    takeoverRate: totalConvs ? (takeovers ?? 0) / totalConvs : 0,
    totalMessages: totalMessages ?? 0,
    recentQuestions: (questions ?? []) as {content: string; created_at: string}[],
  };
}

// ── Knowledge base management ───────────────────────────────────────────────

export interface KbDoc {
  id: string;
  source: string;
  locale: string;
  ref_key: string | null;
  title: string | null;
  body: string;
  is_active: boolean;
  updated_at: string;
}

export async function listKb(locale?: string): Promise<KbDoc[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServiceClient();
  let query = supabase
    .from('kb_documents')
    .select('id,source,locale,ref_key,title,body,is_active,updated_at')
    .order('locale')
    .order('ref_key');
  if (locale) query = query.eq('locale', locale);
  const {data} = await query;
  return (data ?? []) as KbDoc[];
}

export async function upsertKbDoc(input: {
  id?: string;
  locale: string;
  title: string;
  body: string;
  is_active?: boolean;
  updatedBy: string;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseServiceClient();
  if (input.id) {
    await supabase
      .from('kb_documents')
      .update({
        title: input.title,
        body: input.body,
        is_active: input.is_active ?? true,
        updated_by: input.updatedBy,
      })
      .eq('id', input.id);
    return input.id;
  }
  const {data} = await supabase
    .from('kb_documents')
    .insert({
      source: 'admin',
      locale: input.locale,
      ref_key: `admin.${Date.now()}`,
      title: input.title,
      body: input.body,
      is_active: input.is_active ?? true,
      updated_by: input.updatedBy,
    })
    .select('id')
    .single();
  return data?.id ?? null;
}

export async function deleteKbDoc(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createSupabaseServiceClient();
  await supabase.from('kb_documents').delete().eq('id', id);
}
