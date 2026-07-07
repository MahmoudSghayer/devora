'use client';

import {useState} from 'react';

export default function OnlineToggle({initial}: {initial: boolean}) {
  const [online, setOnline] = useState(initial);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    const next = !online;
    try {
      const res = await fetch('/api/admin/settings/online', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({online: next}),
      });
      if (res.ok) setOnline(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-[14px] border border-border-sub bg-surface p-5">
      <div>
        <p className="text-[15px] font-semibold text-ink">
          Online representative
        </p>
        <p className="mt-1 max-w-md text-[13px] text-muted">
          {online
            ? 'Visitors see “Online representative available”. You can take over any conversation live.'
            : 'Visitors see “AI assistant available 24/7”. The assistant handles everything automatically.'}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={online}
        aria-label="Toggle online representative"
        disabled={busy}
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          online ? 'bg-emerald-500' : 'bg-border-card'
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white transition-all ${
            online ? 'start-6' : 'start-1'
          }`}
        />
      </button>
    </div>
  );
}
