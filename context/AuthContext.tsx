'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

interface AuthValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  sendOtp: (email: string) => Promise<{ error: string | null }>
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>
  /**
   * Redirects the whole page to the provider — there's no session to return
   * here yet. A caught error only ever means the redirect itself couldn't
   * start (e.g. the provider isn't enabled in Supabase); the real outcome
   * comes back through /auth/callback.
   */
  signInWithOAuth: (provider: 'google' | 'facebook', next?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const supabase = createClient()
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile((data as Profile) ?? null)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) void loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (next?.user) {
        void loadProfile(next.user.id)
        // Welcome email, on the first sign-in only.
        //
        // Triggered here rather than in signUp because both routes into a new
        // account end up here: an immediate session, and the confirm-by-email
        // flow where signUp returns no session at all. The endpoint is
        // idempotent — it claims `welcomed_at` before sending — so calling it
        // on every sign-in is safe and covers both.
        if (event === 'SIGNED_IN') {
          void fetch('/api/account/welcome', { method: 'POST' }).catch(() => {})
        }
      } else {
        setProfile(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const sendOtp: AuthValue['sendOtp'] = async (email) => {
    const supabase = createClient()
    if (!supabase) return { error: 'Supabase is not configured.' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    return { error: error?.message ?? null }
  }

  const verifyOtp: AuthValue['verifyOtp'] = async (email, token) => {
    const supabase = createClient()
    if (!supabase) return { error: 'Supabase is not configured.' }
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) return { error: error.message }

    // Give a brand-new account something to look at. Idempotent server-side.
    try {
      await supabase.rpc('seed_demo_data')
    } catch {
      /* optional migration; ignore when absent */
    }
    return { error: null }
  }

  const signInWithPassword: AuthValue['signInWithPassword'] = async (email, password) => {
    const supabase = createClient()
    if (!supabase) return { error: 'Supabase is not configured.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUpWithPassword: AuthValue['signUpWithPassword'] = async (email, password) => {
    const supabase = createClient()
    if (!supabase) return { error: 'Supabase is not configured.', needsConfirmation: false }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message, needsConfirmation: false }

    // With "Confirm email" on, Supabase returns a user but no session — the
    // account only becomes usable after they click the link in their inbox.
    const needsConfirmation = !data.session
    if (data.session) {
      try {
        await supabase.rpc('seed_demo_data')
      } catch {
        /* optional migration */
      }
    }
    return { error: null, needsConfirmation }
  }

  const signInWithOAuth: AuthValue['signInWithOAuth'] = async (provider, next) => {
    const supabase = createClient()
    if (!supabase) return { error: 'Supabase is not configured.' }
    const callback = new URL('/auth/callback', window.location.origin)
    if (next) callback.searchParams.set('next', next)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback.toString() },
    })
    return { error: error?.message ?? null }
  }

  const sendPasswordReset: AuthValue['sendPasswordReset'] = async (email) => {
    const supabase = createClient()
    if (!supabase) return { error: 'Supabase is not configured.' }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    const supabase = createClient()
    if (!supabase) return
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        sendOtp,
        verifyOtp,
        signInWithPassword,
        signUpWithPassword,
        sendPasswordReset,
        signInWithOAuth,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
