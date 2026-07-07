'use client';

import {useEffect, useRef} from 'react';
import {
  createSupabaseBrowserClient,
  isRealtimeConfigured,
} from '@/lib/supabase/client';
import type {ChatMessage, ConversationMode} from '@/lib/chat/types';

interface Handlers {
  onMessage: (m: ChatMessage) => void;
  onMode: (mode: ConversationMode) => void;
  onOnline: (online: boolean) => void;
  onHumanTyping?: () => void;
}

// Visitor-side realtime. Subscribes to:
//  • presence:global (broadcast) → live online/offline toggle
//  • conv:<token>    (broadcast) → human replies, mode changes, agent typing
// The unguessable token is the capability; the channel needs no auth. No-ops
// when Supabase isn't configured (local preview).
export function useRealtimeConversation(token: string | null, handlers: Handlers) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!isRealtimeConfigured()) return;
    const supabase = createSupabaseBrowserClient();

    const presence = supabase
      .channel('presence:global')
      .on('broadcast', {event: 'online'}, ({payload}) =>
        ref.current.onOnline(Boolean((payload as {online?: boolean})?.online))
      )
      .subscribe();

    const channels = [presence];

    if (token) {
      const conv = supabase
        .channel(`conv:${token}`)
        .on('broadcast', {event: 'message'}, ({payload}) => {
          const p = payload as ChatMessage;
          if (p?.id) {
            ref.current.onMessage({
              id: p.id,
              role: p.role,
              author: p.author,
              content: p.content,
              createdAt: p.createdAt,
            });
          }
        })
        .on('broadcast', {event: 'mode'}, ({payload}) =>
          ref.current.onMode((payload as {mode: ConversationMode}).mode)
        )
        .on('broadcast', {event: 'typing'}, () => ref.current.onHumanTyping?.())
        .subscribe();
      channels.push(conv);
    }

    return () => {
      channels.forEach((c) => void supabase.removeChannel(c));
    };
  }, [token]);
}
