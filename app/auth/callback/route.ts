import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Where Google/Facebook send the browser back to after the OAuth screen.
 * Exchanges the one-time `code` for a session (this has to happen
 * server-side — the session cookie is httpOnly), then continues on to
 * wherever the sign-in was headed.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const oauthError = req.nextUrl.searchParams.get('error_description')
  const rawNext = req.nextUrl.searchParams.get('next') ?? '/my-account'
  // Only ever redirect within this site — a `next` value isn't otherwise
  // trusted input, and an absolute/protocol-relative URL here would make
  // this an open redirect.
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/my-account'

  if (oauthError) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(oauthError)}`, req.url))
  }

  if (code) {
    const supabase = await createClient()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, req.url))
      }
    }
  }

  return NextResponse.redirect(new URL(next, req.url))
}
