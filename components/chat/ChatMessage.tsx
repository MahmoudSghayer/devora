'use client';

import {motion, useReducedMotion} from 'motion/react';
import {useTranslations} from 'next-intl';
import {EASE} from '@/lib/motion';
import type {ChatMessage as ChatMessageType} from '@/lib/chat/types';

function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block size-1.5 rounded-full bg-muted"
          animate={reduce ? undefined : {opacity: [0.3, 1, 0.3]}}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}

export default function ChatMessage({message}: {message: ChatMessageType}) {
  const t = useTranslations('chat');
  const reduce = useReducedMotion();
  const isUser = message.role === 'user';
  const isHuman = message.author === 'human_agent';
  const empty = message.content.trim() === '';

  return (
    <motion.div
      initial={reduce ? false : {opacity: 0, y: 6}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.25, ease: EASE}}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className="max-w-[82%]">
        {!isUser && isHuman && (
          <span className="mb-1 block text-[11px] font-mono uppercase tracking-wide text-muted">
            {t('badge_human')}
          </span>
        )}
        <div
          className={[
            'rounded-[14px] px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words',
            isUser
              ? 'bg-amber text-on-amber rounded-ee-[4px]'
              : 'bg-surface-2 text-ink border border-border-sub rounded-es-[4px]',
          ].join(' ')}
        >
          {empty && !isUser ? <TypingDots /> : message.content}
        </div>
      </div>
    </motion.div>
  );
}
