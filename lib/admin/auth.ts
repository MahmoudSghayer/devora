import {createSupabaseServerClient} from '@/lib/supabase/server';

export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
  role: string;
}

// Returns the current active admin, or null. Used both by admin Server
// Components (to render/redirect) and by every admin route handler (to gate).
// Verifies BOTH a valid Supabase session AND an active admin_profiles row —
// a logged-in non-admin user is treated as null.
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (!user) return null;

    const {data} = await supabase
      .from('admin_profiles')
      .select('id,is_active,display_name,role')
      .eq('id', user.id)
      .maybeSingle();
    if (!data?.is_active) return null;

    return {
      id: user.id,
      email: user.email ?? null,
      displayName: data.display_name ?? null,
      role: data.role ?? 'admin',
    };
  } catch {
    return null;
  }
}
