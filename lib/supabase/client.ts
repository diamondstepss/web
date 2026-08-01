'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
// Supabase renamed the browser-safe key from "anon" to "publishable".
// Accept either so the app works whichever the dashboard shows.
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && key && url.startsWith('http') && key.length > 20)

let cached: SupabaseClient | null = null

/**
 * Browser client. Returns null when unconfigured so the UI can show a setup
 * card instead of throwing. Uses cookie storage (via @supabase/ssr) so the
 * session is also readable by server components and middleware.
 */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!cached) cached = createBrowserClient(url!, key!)
  return cached
}

/** For call sites that have already checked `isSupabaseConfigured`. */
export function db(): SupabaseClient {
  const c = createClient()
  if (!c) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local',
    )
  }
  return c
}
