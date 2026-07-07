import Anthropic from '@anthropic-ai/sdk';

// Model ids (latest Claude family). Overridable via env for easy upgrades.
export const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL || 'claude-sonnet-5';
export const SUMMARY_MODEL =
  process.env.ANTHROPIC_SUMMARY_MODEL || 'claude-sonnet-5';

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  if (!cached) cached = new Anthropic({apiKey});
  return cached;
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
