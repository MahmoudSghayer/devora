import LoginForm from '@/components/admin/LoginForm';

export default function AdminLoginPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-[22px] font-bold text-ink">
          devora<span className="text-amber"> admin</span>
        </h1>
        <p className="mb-6 text-[13px] text-muted">
          Sign in to manage conversations, leads and the assistant.
        </p>
        <LoginForm />
        {!configured && (
          <p className="mt-4 text-[12px] text-faint">
            Supabase isn’t configured on this environment yet — set
            NEXT_PUBLIC_SUPABASE_URL and the keys to enable login.
          </p>
        )}
      </div>
    </div>
  );
}
