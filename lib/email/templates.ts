import type {ChatMessage} from '@/lib/chat/types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function historyText(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      const who =
        m.role === 'user'
          ? 'Visitor'
          : m.author === 'human_agent'
            ? 'devora team'
            : 'AI';
      return `${who}: ${m.content}`;
    })
    .join('\n');
}

function shell(title: string, rows: string, bodyBlocks: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a">
  <div style="background:#0f0f0f;color:#f4c542;padding:18px 22px;border-radius:12px 12px 0 0;font-weight:700;font-size:15px">devora · ${esc(title)}</div>
  <div style="border:1px solid #e6e6e6;border-top:none;border-radius:0 0 12px 12px;padding:22px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    ${bodyBlocks}
  </div>
</div>`;
}

function row(label: string, value?: string): string {
  if (!value) return '';
  return `<tr><td style="padding:6px 0;color:#777;width:120px;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;font-weight:600">${esc(value)}</td></tr>`;
}

function block(label: string, value?: string): string {
  if (!value) return '';
  return `<div style="margin-top:18px"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#999;margin-bottom:6px">${esc(label)}</div><div style="white-space:pre-wrap;line-height:1.6;background:#faf9f5;border:1px solid #eee;border-radius:8px;padding:12px">${esc(value)}</div></div>`;
}

const PACKAGE_LABEL: Record<string, string> = {
  launch: 'Launch — from $1,650 + $200/mo',
  studio: 'Studio — from $2,650 + $250/mo',
  growth: 'Growth — from $5,000 + $300/mo',
};

export function leadEmail(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  request: string;
  recommendedPackage?: string;
  aiSummary?: string;
  locale: string;
  history: ChatMessage[];
}): {subject: string; text: string; html: string} {
  const subject = `New lead — ${data.name}${data.company ? ` (${data.company})` : ''}`;
  const pkg = data.recommendedPackage
    ? PACKAGE_LABEL[data.recommendedPackage] ?? data.recommendedPackage
    : undefined;

  const text = [
    'NEW LEAD (via the devora assistant)',
    '',
    `Name:     ${data.name}`,
    `Email:    ${data.email}`,
    `Phone:    ${data.phone || '—'}`,
    `Company:  ${data.company || '—'}`,
    `Language: ${data.locale}`,
    pkg ? `Suggested package: ${pkg}` : '',
    '',
    'REQUEST',
    data.request,
    '',
    data.aiSummary ? 'AI SUMMARY' : '',
    data.aiSummary || '',
    '',
    data.history.length ? 'CONVERSATION' : '',
    data.history.length ? historyText(data.history) : '',
  ]
    .filter((l) => l !== '')
    .join('\n');

  const html = shell(
    'New lead',
    row('Name', data.name) +
      row('Email', data.email) +
      row('Phone', data.phone) +
      row('Company', data.company) +
      row('Language', data.locale) +
      row('Suggested', pkg),
    block('Request', data.request) +
      block('AI summary', data.aiSummary) +
      block('Conversation', data.history.length ? historyText(data.history) : '')
  );

  return {subject, text, html};
}

export function supportEmail(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  body: string;
  aiSummary?: string;
  locale: string;
  history: ChatMessage[];
}): {subject: string; text: string; html: string} {
  const subject = `Support — ${data.subject} · ${data.name}`;

  const text = [
    'NEW SUPPORT REQUEST (via the devora assistant)',
    '',
    `Name:     ${data.name}`,
    `Email:    ${data.email}`,
    `Phone:    ${data.phone || '—'}`,
    `Language: ${data.locale}`,
    `Subject:  ${data.subject}`,
    '',
    'MESSAGE',
    data.body,
    '',
    data.aiSummary ? 'AI SUMMARY' : '',
    data.aiSummary || '',
    '',
    data.history.length ? 'CONVERSATION' : '',
    data.history.length ? historyText(data.history) : '',
  ]
    .filter((l) => l !== '')
    .join('\n');

  const html = shell(
    'Support request',
    row('Name', data.name) +
      row('Email', data.email) +
      row('Phone', data.phone) +
      row('Language', data.locale) +
      row('Subject', data.subject),
    block('Message', data.body) +
      block('AI summary', data.aiSummary) +
      block('Conversation', data.history.length ? historyText(data.history) : '')
  );

  return {subject, text, html};
}
