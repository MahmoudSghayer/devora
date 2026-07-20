'use client';

import {useState} from 'react';

interface Result {
  ok: boolean;
  delivered?: boolean;
  error?: string;
  detail?: string;
  host?: string;
  port?: number;
  to?: string | null;
}

// Turns a raw SMTP error into a plain-English fix.
function interpret(r: Result): string | null {
  if (r.ok && r.delivered) {
    return `Zoho accepted the message and sent it to ${r.to}. If it isn't in the inbox, check the Spam folder — first sends from a custom domain often land there.`;
  }
  if (r.error === 'not_configured') return r.detail ?? 'Email is not configured.';
  const d = (r.detail || '').toLowerCase();
  if (d.includes('invalid login') || d.includes('535') || d.includes('auth')) {
    return 'Authentication failed. Use a Zoho APP-SPECIFIC PASSWORD for ZOHO_SMTP_PASS (Zoho → My Account → Security → App Passwords), not your normal login password.';
  }
  if (d.includes('enotfound') || d.includes('getaddrinfo') || d.includes('econnrefused')) {
    return `Can't reach ${r.host}. Wrong host for your Zoho region/plan — try smtp.zoho.eu (EU accounts) or smtppro.zoho.com (organization/custom-domain plans). Keep port 465.`;
  }
  if (d.includes('timeout') || d.includes('etimedout') || d.includes('greeting never')) {
    return `Connection to ${r.host}:${r.port} timed out. Try port 465 with SSL, or switch host to smtp.zoho.eu / smtppro.zoho.com.`;
  }
  if (d.includes('relay') || d.includes('553') || d.includes('access denied')) {
    return 'Zoho rejected the sender. Make sure SMTP access is enabled in Zoho (Settings → Mail Accounts → IMAP/SMTP) and that ZOHO_SMTP_USER is the mailbox doing the sending.';
  }
  return r.detail ?? 'Send failed for an unknown reason.';
}

export default function EmailTest() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const run = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/email-test', {method: 'POST'});
      setResult(await res.json());
    } catch {
      setResult({ok: false, error: 'network', detail: 'Request failed.'});
    } finally {
      setSending(false);
    }
  };

  const good = result?.ok && result.delivered;

  return (
    <div className="rounded-[14px] border border-border-sub bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold text-ink">Email delivery test</p>
          <p className="mt-1 max-w-md text-[13px] text-muted">
            Sends a real message to your CONTACT_TO inbox and shows the exact
            result — so you can tell a spam-folder issue from an SMTP error.
          </p>
        </div>
        <button
          onClick={run}
          disabled={sending}
          className="rounded-[10px] bg-amber px-3.5 py-2 text-[13px] font-semibold text-on-amber transition-colors hover:bg-amber-hi disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send test email'}
        </button>
      </div>

      {result && (
        <div className="mt-4">
          <p
            className={`text-[13px] font-medium ${
              good ? 'text-emerald-300' : 'text-red-400'
            }`}
          >
            {good ? 'Delivered to Zoho ✅' : 'Send failed ✗'}
          </p>
          <p className="mt-1 text-[13px] text-ink-2">{interpret(result)}</p>
          <pre className="mt-3 overflow-x-auto rounded-[8px] bg-surface-2 p-3 text-[11px] text-muted">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
