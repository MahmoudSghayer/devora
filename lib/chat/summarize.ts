import {getAnthropic, isAnthropicConfigured, SUMMARY_MODEL} from '@/lib/anthropic';
import {tierLine} from '@/lib/pricing/config';
import type {ChatLocale, ChatMessage} from './types';

// Generate a short internal summary of a lead/support request for the team.
// Non-streaming, single call, capped tokens. Returns '' when Claude isn't
// configured (the email/lead still saves and sends without a summary).
export async function summarize(input: {
  locale: ChatLocale;
  kind: 'lead' | 'support';
  request: string;
  history: ChatMessage[];
}): Promise<string> {
  if (!isAnthropicConfigured()) return '';
  try {
    const anthropic = getAnthropic();
    const convo = input.history
      .map((m) => `${m.role === 'user' ? 'Visitor' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const system =
      input.kind === 'lead'
        ? `A visitor to devora (a full-stack web studio) submitted a lead through the site assistant. Write a concise 2–3 sentence internal summary for the team: what they want, any useful context, and which build package fits best and why — ${tierLine('launch')}; ${tierLine('studio')}; or ${tierLine('growth')}. Be factual; never invent details. Respond in English regardless of the conversation language.`
        : 'A visitor submitted a support request through the site assistant. Write a concise 2–3 sentence internal summary for the team: the problem and any relevant context. Be factual; never invent details. Respond in English regardless of the conversation language.';

    const res = await anthropic.messages.create({
      model: SUMMARY_MODEL,
      max_tokens: 220,
      system,
      messages: [
        {
          role: 'user',
          content: `Request:\n${input.request}\n\nConversation so far:\n${convo || '(none)'}`,
        },
      ],
    });

    return res.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();
  } catch {
    return '';
  }
}
