'use server';

import {redirect} from 'next/navigation';
import {createSupabaseServerClient} from '@/lib/supabase/server';

function supabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function loginAction(
  _prev: {error?: string} | undefined,
  formData: FormData
): Promise<{error?: string}> {
  if (!supabaseAuthConfigured()) {
    return {error: 'Supabase auth is not configured on this environment.'};
  }
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (!email || !password) return {error: 'Enter your email and password.'};

  const supabase = await createSupabaseServerClient();
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) return {error: error.message};

  redirect('/admin');
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
