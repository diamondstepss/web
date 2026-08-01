'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, X } from 'lucide-react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { SITE } from '@/data/site'

/**
 * Landing page for the "forgot password" email link.
 *
 * Supabase puts a recovery session in the URL fragment; the client picks it up
 * automatically (detectSessionInUrl), which is what authorises updateUser here.
 */
export function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    // A recovery link produces a session; without one there's nothing to update.
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')

    const supabase = createClient()
    if (!supabase) return setError('Supabase is not configured.')

    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    setDone(true)
    setTimeout(() => router.replace('/my-account'), 1800)
  }

  const field = {
    height: 52,
    background: 'color-mix(in srgb, var(--accent) 7%, var(--surface))',
    border: '1px solid transparent',
    borderRadius: 10,
    color: 'var(--text-primary)',
  } as const

  return (
    <div className="min-h-dvh flex items-center justify-center px-5 py-20" style={{ background: 'var(--bg)' }}>
      <Link
        href="/"
        aria-label="Back to store"
        className="absolute top-5 left-5 sm:top-7 sm:left-7 flex items-center justify-center transition-opacity hover:opacity-70"
        style={{
          width: 40,
          height: 40,
          borderRadius: 99,
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          background: 'var(--surface)',
        }}
      >
        <X size={17} />
      </Link>

      <div
        className="w-full max-w-[420px] p-7 sm:p-10"
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: '0 24px 60px -24px rgba(0,0,0,0.35)',
        }}
      >
        <Link href="/" className="inline-block mb-9">
          <Image
            src="/brand/wide-logo.png"
            alt={SITE.name}
            width={190}
            height={93}
            priority
            className="h-9 w-auto dark-invert"
          />
        </Link>

        {done ? (
          <div className="text-center py-4">
            <CheckCircle2 size={44} style={{ color: 'var(--success)', margin: '0 auto 18px' }} />
            <h1
              className="font-black uppercase mb-2"
              style={{ fontFamily: 'var(--font-outfit)', fontSize: 28, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
            >
              Password updated
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Taking you to your account…
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Almost done
            </p>
            <h1
              className="font-black uppercase leading-none mb-7"
              style={{
                fontFamily: 'var(--font-outfit)',
                fontSize: 'clamp(28px, 6vw, 36px)',
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
              }}
            >
              New password
            </h1>

            {!isSupabaseConfigured || !ready ? (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                This page only works from the reset link in your email. Request a new one from the{' '}
                <Link href="/login" style={{ color: 'var(--accent)' }} className="underline">
                  sign-in page
                </Link>
                .
              </p>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label htmlFor="np" className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="np"
                      autoFocus
                      required
                      minLength={6}
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-4 pr-12 text-base sm:text-sm outline-none"
                      style={{ ...field, borderColor: password ? 'var(--accent)' : 'transparent' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute top-1/2 -translate-y-1/2 right-3 p-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="cp" className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                    Confirm password
                  </label>
                  <input
                    id="cp"
                    required
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-4 text-base sm:text-sm outline-none"
                    style={{
                      ...field,
                      borderColor: confirm ? (confirm === password ? 'var(--success)' : 'var(--danger)') : 'transparent',
                    }}
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    className="text-xs px-4 py-3 leading-relaxed"
                    style={{
                      background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                      color: 'var(--danger)',
                      borderRadius: 10,
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || !password || !confirm}
                  className="group flex items-center justify-center gap-2 mx-auto text-xs font-black uppercase tracking-widest text-white"
                  style={{
                    height: 48,
                    paddingInline: 34,
                    borderRadius: 99,
                    background: 'var(--accent)',
                    fontFamily: 'var(--font-outfit)',
                    opacity: busy || !password || !confirm ? 0.5 : 1,
                    cursor: busy || !password || !confirm ? 'not-allowed' : 'pointer',
                  }}
                >
                  {busy ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Saving
                    </>
                  ) : (
                    <>
                      Update password
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
