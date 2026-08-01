import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next 16 renamed the `middleware` convention to `proxy` (runtime is always
// nodejs here — the edge runtime is not supported by `proxy`).

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Routes that require a signed-in customer. */
const PROTECTED = ['/my-account', '/wishlist']

/** Routes that additionally require profiles.is_admin. */
const ADMIN_ONLY = ['/admin']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  // Unconfigured project: let everything through so the setup card can render.
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Refreshes an expiring token and writes the new cookies onto the response.
  // Must use getUser(), not getSession() — getSession() trusts the cookie
  // without revalidating it against the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const needsAdmin = ADMIN_ONLY.some((p) => pathname.startsWith(p))
  const needsAuth = needsAdmin || PROTECTED.some((p) => pathname.startsWith(p))

  if (!user && needsAuth) {
    const login = request.nextUrl.clone()
    login.pathname = '/login'
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  // Being signed in is not enough for /admin — any customer would qualify.
  // The flag is checked server-side here AND enforced by RLS in Postgres, so
  // a forged client cannot read another customer's data either way.
  if (user && needsAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.is_admin) {
      const home = request.nextUrl.clone()
      home.pathname = '/'
      home.searchParams.set('denied', 'admin')
      return NextResponse.redirect(home)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — those never need a
     * session refresh and running middleware on them wastes edge invocations.
     */
    '/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
