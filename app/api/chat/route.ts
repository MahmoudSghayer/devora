import {NextResponse} from 'next/server';
import {chatMessageSchema} from '@/lib/validation';
import {getConversation, getMessages, insertMessage} from '@/lib/chat/store';
import {buildKbContext} from '@/lib/chat/kb';
import {buildSystemPrompt} from '@/lib/chat/systemPrompt';
import {getAnthropic, isAnthropicConfigured, CHAT_MODEL} from '@/lib/anthropic';
import {isSupabaseConfigured} from '@/lib/supabase/service';
import {logEvent} from '@/lib/analytics';
import {rateLimit, getRequestIp} from '@/lib/ratelimit';
import type {
  ChatLocale,
  ChatMessage,
  ChatStreamEvent,
  ConversationMode,
} from '@/lib/chat/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();
const sse = (event: ChatStreamEvent) =>
  encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Honest fallback shown ONLY when ANTHROPIC_API_KEY isn't reaching the app.
// It does not pretend to answer — it says the AI is offline and offers a human
// handoff, so a misconfiguration is obvious instead of masquerading as a reply.
function fallbackReply(locale: ChatLocale): string {
  if (locale === 'ar') {
    return 'أهلًا، أنا نور من ديفورا 👋 مساعدي الذكي غير متاح على هذه البيئة الآن، لكنني لا أريد أن أتركك تنتظر — أخبِرني بما تحتاجه وشارِكني بريدك الإلكتروني وسيتابع معك الفريق مباشرةً.';
  }
  return "Hi, I'm Noor from devora 👋 My AI isn't reachable on this environment right now, but I don't want to leave you waiting — tell me what you need and share your email, and the team will get right back to you.";
}

function chunk(text: string, size = 3): string[] {
  const words = text.split(/(\s+)/);
  const out: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    out.push(words.slice(i, i + size).join(''));
  }
  return out;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ok: false, error: 'invalid_json'}, {status: 400});
  }

  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ok: false, error: 'validation'}, {status: 422});
  }
  const {conversationId, token, message, clientHistory} = parsed.data;

  // Rate limit per conversation + IP.
  const ip = getRequestIp(request);
  const rl = await rateLimit('chat', `${conversationId}:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ok: false, error: 'rate_limited'}, {status: 429});
  }

  // Resolve locale / mode / history.
  let locale: ChatLocale = parsed.data.locale ?? 'en';
  let mode: ConversationMode = 'ai';
  let history: ChatMessage[] = [];

  if (isSupabaseConfigured()) {
    const conv = await getConversation(conversationId, token);
    if (!conv) {
      return NextResponse.json({ok: false, error: 'not_found'}, {status: 404});
    }
    locale = conv.locale;
    mode = conv.mode;
    history = await getMessages(conversationId);
    await insertMessage({
      conversationId,
      role: 'user',
      author: 'visitor',
      content: message,
    });
    void logEvent('message_sent', {
      conversationId,
      locale,
      props: {author: 'visitor'},
    });
  }

  // Human has taken over → don't call the AI. Persist happened above; the admin
  // reply reaches the visitor over Realtime (Phase 4).
  if (mode === 'human') {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(sse({type: 'meta', conversationId, mode}));
        controller.enqueue(sse({type: 'handoff', mode: 'human'}));
        controller.enqueue(sse({type: 'done'}));
        controller.close();
      },
    });
    return sseResponse(stream);
  }

  // Build the grounded prompt + message list for Claude.
  const kb = await buildKbContext(locale);
  const system = buildSystemPrompt(locale, kb);

  const priorTurns = (
    isSupabaseConfigured()
      ? history
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
            content: m.content,
          }))
      : (clientHistory ?? []).map((t) => ({role: t.role, content: t.content}))
  ).slice(-20);

  const claudeMessages = [...priorTurns, {role: 'user' as const, content: message}];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sse({type: 'meta', conversationId, mode: 'ai'}));

      let assistantText = '';
      try {
        if (isAnthropicConfigured()) {
          const anthropic = getAnthropic();
          const claudeStream = anthropic.messages.stream({
            model: CHAT_MODEL,
            max_tokens: 1024,
            system,
            messages: claudeMessages,
          });
          claudeStream.on('text', (t) => {
            assistantText += t;
            controller.enqueue(sse({type: 'delta', text: t}));
          });
          await claudeStream.finalMessage();
        } else {
          console.warn(
            '[chat] ANTHROPIC_API_KEY not set on this deployment — serving offline fallback. Set the key and redeploy so Claude answers.'
          );
          const text = fallbackReply(locale);
          for (const piece of chunk(text)) {
            assistantText += piece;
            controller.enqueue(sse({type: 'delta', text: piece}));
            await sleep(18);
          }
        }
      } catch {
        controller.enqueue(sse({type: 'error', message: 'stream_failed'}));
      }

      let savedId: string | undefined;
      if (assistantText.trim()) {
        const saved = await insertMessage({
          conversationId,
          role: 'assistant',
          author: 'ai',
          content: assistantText,
          metadata: {model: isAnthropicConfigured() ? CHAT_MODEL : 'fallback'},
        });
        savedId = saved?.id;
        void logEvent('message_sent', {
          conversationId,
          locale,
          props: {author: 'ai'},
        });
      }

      controller.enqueue(sse({type: 'done', messageId: savedId}));
      controller.close();
    },
  });

  return sseResponse(stream);
}

function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
