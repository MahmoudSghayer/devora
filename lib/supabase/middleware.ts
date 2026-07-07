import {createServerClient} from '@supabase/ssr';
import {NextResponse, type NextRequest} from 'next/server';

// Refreshes the Supabase auth session on /admin requests and reports whether
// the caller is an active admin. Used by proxy.ts to gate the admin app. When
// Supabase env is absent, returns isAdmin:false so /admin bounces to /login
// (which renders a "not configured" note) instead of crashing.
export async function updateAdminSession(
  request: NextRequest
): Promise<{response: NextResponse; isAdmin: boolean}> {
  let response = NextResponse.next({request});

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return {response, isAdmin: false};

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));
        response = NextResponse.next({request});
        cookiesToSet.forEach(({name, value, options}) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  let isAdmin = false;
  try {
    const {
      data: {user},
    } = await supabase.auth.getUser();
    if (user) {
      const {data} = await supabase
        .from('admin_profiles')
        .select('id,is_active')
        .eq('id', user.id)
        .maybeSingle();
      isAdmin = Boolean(data?.is_active);
    }
  } catch {
    isAdmin = false;
  }

  return {response, isAdmin};
}
