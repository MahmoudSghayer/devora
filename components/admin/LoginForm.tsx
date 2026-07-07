'use client';

import {useActionState} from 'react';
import {loginAction} from '@/lib/admin/actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  const input =
    'w-full rounded-[10px] border border-border-card bg-surface-2 px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-faint focus:border-border-ghost';

  return (
    <form action={action} className="flex flex-col gap-3">
      <input className={input} name="email" type="email" placeholder="Email" autoComplete="email" />
      <input
        className={input}
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
      />
      {state?.error && (
        <p role="alert" className="text-[13px] text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-[10px] bg-amber py-2.5 text-[14px] font-semibold text-on-amber transition-colors hover:bg-amber-hi disabled:opacity-50"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
