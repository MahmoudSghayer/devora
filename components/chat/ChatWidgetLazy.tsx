'use client';

import dynamic from 'next/dynamic';

// The chat widget (and its Supabase realtime + chat deps) isn't needed for first
// paint — it's a floating launcher. Loading it client-side only (ssr: false) and
// lazily keeps its JS out of the initial/critical bundle on every page.
const ChatWidget = dynamic(() => import('./ChatWidget'), {ssr: false});

export default function ChatWidgetLazy() {
  return <ChatWidget />;
}
