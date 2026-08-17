'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, ArrowLeft, Loader2, ShieldCheck, X, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import SupabaseSetupNotice from '@/components/SupabaseSetupNotice'
import { SITE } from '@/data/site'
import { DEFAULT_SETTINGS, type StoreSettings } from '@/lib/settings'

const OTP_LENGTH = 6
const RESEND_SECONDS = 30

export function LoginPage({ settings = DEFAULT_SETTINGS }: { settings?: StoreSettings }) {
  const { sendOtp, verifyOtp, signInWithPassword, signUpWithPassword, sendPasswordReset, session } =
    useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('next') ?? '/my-account'

  // Two ways in: a one-time code, or a classic password. Password is the
  // default because it's one step for returning customers.
  const [mode, setMode] = useState<'password' | 'otp'>('password')
  const [isSignUp, setIsSignUp] = useState(false)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const boxes = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (session) router.replace(redirectTo)
  }, [session, router, redirectTo])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  /** Supabase returns terse machine errors — make them mean something. */
  const humanise = (raw: string) => {
    const m = raw.toLowerCase()
    if (m.includes('rate limit') || m.includes('you can only request'))
      return 'Too many codes requested. Wait a minute, then try again.'
    if (m.includes('failed to fetch') || m.includes('network'))
      return 'Could not reach the server. Check your connection, or disable any ad blocker for this site.'
    if (m.includes('expired')) return 'That code has expired. Request a new one.'
    if (m.includes('invalid login credentials'))
      return 'Wrong email or password. Try again, or use a one-time code instead.'
    if (m.includes('email not confirmed'))
      return 'Confirm your email first — check your inbox for the link.'
    if (m.includes('password should be'))
      return 'Password must be at least 6 characters.'
    if (m.includes('already registered'))
      return 'That email already has an account. Sign in instead.'
    if (m.includes('invalid')) return 'That code is not right. Check it and try again.'
    return raw
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)

    if (isSignUp) {
      const { error, needsConfirmation } = await signUpWithPassword(email.trim(), password)
      setBusy(false)
      if (error) return setError(humanise(error))
      if (needsConfirmation) {
        return setNotice('Account created. Check your email to confirm it, then sign in.')
      }
      router.replace(redirectTo)
      return
    }

    const { error } = await signInWithPassword(email.trim(), password)
    setBusy(false)
    if (error) return setError(humanise(error))
    router.replace(redirectTo)
  }

  const forgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email above first, then tap Forgot password.')
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    const { error } = await sendPasswordReset(email.trim())
    setBusy(false)
    if (error) return setError(humanise(error))
    setNotice(`Password reset link sent to ${email.trim()}.`)
  }

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await sendOtp(email.trim())
    setBusy(false)
    if (error) return setError(humanise(error))
    setStep('otp')
    setCooldown(RESEND_SECONDS)
    setTimeout(() => boxes.current[0]?.focus(), 60)
  }

  const submitOtp = async (code: string) => {
    setBusy(true)
    setError(null)
    const { error } = await verifyOtp(email.trim(), code)
    setBusy(false)
    if (error) {
      setError(humanise(error))
      setDigits(Array(OTP_LENGTH).fill(''))
      boxes.current[0]?.focus()
      return
    }
    router.replace(redirectTo)
  }

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '')
    if (!clean && v) return

    // A pasted code lands entirely in whichever box has focus.
    if (clean.length > 1) {
      const next = clean.slice(0, OTP_LENGTH).split('')
      const filled = [...Array(OTP_LENGTH)].map((_, k) => next[k] ?? '')
      setDigits(filled)
      if (filled.every(Boolean)) void submitOtp(filled.join(''))
      else boxes.current[Math.min(next.length, OTP_LENGTH - 1)]?.focus()
      return
    }

    const next = [...digits]
    next[i] = clean
    setDigits(next)
    if (clean && i < OTP_LENGTH - 1) boxes.current[i + 1]?.focus()
    if (next.every(Boolean)) void submitOtp(next.join(''))
  }

  const onKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus()
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-5 py-16" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-xl">
          <SupabaseSetupNotice />
        </div>
      </div>
    )
  }

  // Soft, tinted field styling — the reference look, in our red.
  const field = {
    height: 52,
    background: 'var(--field-bg)',
    border: '1px solid transparent',
    borderRadius: 10,
    color: 'var(--text-primary)',
    transition: 'border-color .2s ease, background .2s ease',
  } as const

  return (
    <div
      className="min-h-dvh grid lg:grid-cols-2"
      style={{
        background: 'var(--bg)',
        // Local tint tokens so both themes get the soft wash the reference has
        ['--field-bg' as string]: 'color-mix(in srgb, var(--accent) 7%, var(--surface))',
        ['--panel-bg' as string]: 'color-mix(in srgb, var(--accent) 12%, var(--bg))',
      }}
    >
      {/* Close — the only way out, since this page has no header */}
      <Link
        href="/"
        aria-label="Back to store"
        className="absolute top-5 left-5 sm:top-7 sm:left-7 z-20 flex items-center justify-center transition-opacity hover:opacity-70"
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

      {/* ── Form side ───────────────────────────────────────────────── */}
      <section className="flex items-center justify-center px-5 sm:px-10 py-20 lg:py-16">
        <div
          className="w-full max-w-[420px] p-7 sm:p-10 fade-up"
          style={{
            background: 'var(--surface)',
            borderRadius: 20,
            border: '1px solid var(--border)',
            boxShadow: '0 24px 60px -24px rgba(0,0,0,0.35)',
          }}
        >
          {/* Mobile only — on desktop the wordmark lives in the brand panel */}
          <Link href="/" className="lg:hidden inline-block mb-8">
            <Image
              src="/brand/wide-logo.png"
              alt={SITE.name}
              width={190}
              height={93}
              priority
              className="h-9 w-auto dark-invert"
            />
          </Link>
          <p className="text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>
            {mode === 'otp' && step === 'otp' ? 'Almost there' : isSignUp ? 'Join us' : 'Welcome back'}
          </p>
          <h1
            className="font-black uppercase leading-none mb-6"
            style={{
              fontFamily: 'var(--font-outfit)',
              fontSize: 'clamp(30px, 7vw, 40px)',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            {mode === 'otp' && step === 'otp' ? 'Enter code' : isSignUp ? 'Create account' : 'Sign in'}
          </h1>

          {/* Method switch */}
          {!(mode === 'otp' && step === 'otp') && (
            <div
              className="grid grid-cols-2 p-1 mb-7"
              style={{ background: 'var(--field-bg)', borderRadius: 12 }}
            >
              {([
                ['password', 'Password'],
                ['otp', 'Email code'],
              ] as const).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m)
                    setError(null)
                    setNotice(null)
                  }}
                  className="py-2.5 text-xs font-bold transition-all duration-200"
                  style={{
                    borderRadius: 9,
                    background: mode === m ? 'var(--accent)' : 'transparent',
                    color: mode === m ? '#fff' : 'var(--text-muted)',
                    fontFamily: 'var(--font-outfit)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={submitPassword} className="space-y-5">
              <div>
                <label
                  htmlFor="pw-email"
                  className="block text-xs font-semibold mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Email
                </label>
                <input
                  id="pw-email"
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full px-4 text-base sm:text-sm outline-none"
                  style={{ ...field, borderColor: email ? 'var(--accent)' : 'transparent' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="pw" className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={forgotPassword}
                      className="text-xs font-semibold transition-opacity hover:opacity-70"
                      style={{ color: 'var(--accent)' }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="pw"
                    required
                    minLength={6}
                    type={showPw ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'At least 6 characters' : '••••••••'}
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

              {error && <ErrorNote message={error} />}
              {notice && <NoticeNote message={notice} />}

              <button
                type="submit"
                disabled={busy || !email || !password}
                className="group flex items-center justify-center gap-2 mx-auto text-xs font-black uppercase tracking-widest text-white"
                style={{
                  height: 48,
                  paddingInline: 34,
                  borderRadius: 99,
                  background: 'var(--accent)',
                  fontFamily: 'var(--font-outfit)',
                  opacity: busy || !email || !password ? 0.5 : 1,
                  cursor: busy || !email || !password ? 'not-allowed' : 'pointer',
                  boxShadow: busy || !email || !password ? 'none' : '0 10px 24px -10px var(--accent)',
                  transition: 'opacity .2s ease, box-shadow .2s ease, transform .2s ease',
                }}
              >
                {busy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Please wait
                  </>
                ) : (
                  <>
                    {isSignUp ? 'Create account' : 'Sign in'}
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp((v) => !v)
                    setError(null)
                    setNotice(null)
                  }}
                  style={{ color: 'var(--accent)', fontWeight: 700 }}
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </form>
          ) : step === 'email' ? (
            <form onSubmit={submitEmail} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Email
                </label>
                <input
                  id="email"
                  autoFocus
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full px-4 text-base sm:text-sm outline-none"
                  style={{ ...field, borderColor: email ? 'var(--accent)' : 'transparent' }}
                />
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  We&apos;ll send a 6-digit code — no password needed.
                </p>
              </div>

              {error && <ErrorNote message={error} />}

              <button
                type="submit"
                disabled={busy || !email}
                className="group flex items-center justify-center gap-2 mx-auto text-xs font-black uppercase tracking-widest text-white"
                style={{
                  height: 48,
                  paddingInline: 34,
                  borderRadius: 99,
                  background: 'var(--accent)',
                  fontFamily: 'var(--font-outfit)',
                  opacity: busy || !email ? 0.5 : 1,
                  cursor: busy || !email ? 'not-allowed' : 'pointer',
                  boxShadow: busy || !email ? 'none' : '0 10px 24px -10px var(--accent)',
                }}
              >
                {busy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Sending
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Sent to{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, wordBreak: 'break-all' }}>
                  {email}
                </span>
              </p>

              {/* flex-1 + max width so six boxes always fit, even at 360px */}
              <div className="flex gap-1.5 sm:gap-2">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      boxes.current[i] = el
                    }}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={onKeyDown(i)}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={OTP_LENGTH}
                    aria-label={`Digit ${i + 1}`}
                    disabled={busy}
                    className="flex-1 min-w-0 text-center font-black outline-none"
                    style={{
                      ...field,
                      maxWidth: 56,
                      height: 58,
                      fontSize: 22,
                      fontFamily: 'var(--font-outfit)',
                      borderColor: d ? 'var(--accent)' : 'transparent',
                    }}
                  />
                ))}
              </div>

              {error && <ErrorNote message={error} />}

              {busy && (
                <p
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
                >
                  <Loader2 size={14} className="animate-spin" /> Verifying
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setStep('email')
                    setDigits(Array(OTP_LENGTH).fill(''))
                    setError(null)
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <ArrowLeft size={13} /> Change email
                </button>
                <button
                  disabled={cooldown > 0}
                  onClick={async () => {
                    setCooldown(RESEND_SECONDS)
                    setError(null)
                    const { error } = await sendOtp(email.trim())
                    if (error) setError(humanise(error))
                  }}
                  className="text-xs font-bold whitespace-nowrap"
                  style={{
                    color: cooldown > 0 ? 'var(--text-muted)' : 'var(--accent)',
                    cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          )}

          <div
            className="flex items-start gap-2 mt-6 pt-5"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <ShieldCheck size={14} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Used only for sign-in and order updates. See our{' '}
              <Link href="/privacy-policy-2" style={{ color: 'var(--accent)' }} className="underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── Brand side (hidden on mobile) ───────────────────────────── */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16"
        style={{ background: 'var(--panel-bg)' }}
      >
        {/* Drifting accent orb keeps the panel alive without distracting */}
        <div
          aria-hidden
          className="absolute orb-drift"
          style={{
            top: '-12%',
            right: '-14%',
            width: 620,
            height: 620,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--accent) 34%, transparent) 0%, transparent 68%)',
            filter: 'blur(8px)',
          }}
        />

        {/* Wordmark — the brand anchor for this screen */}
        <Link href="/" className="relative fade-up" style={{ animationDelay: '.05s' }}>
          <Image
            src="/brand/wide-logo.png"
            alt={SITE.name}
            width={230}
            height={112}
            priority
            className="h-11 w-auto dark-invert"
          />
        </Link>

        {/* Product hero */}
        <div className="relative flex-1 flex items-center justify-center py-8">
          <div className="relative w-full max-w-[400px]">
            <div
              aria-hidden
              className="absolute inset-x-8 bottom-2"
              style={{
                height: 26,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.28)',
                filter: 'blur(22px)',
              }}
            />
            <Image
              src="https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=900&h=900&fit=crop&auto=format"
              alt=""
              aria-hidden
              width={420}
              height={420}
              className="relative w-full h-auto float-y"
              style={{ borderRadius: 28 }}
            />
          </div>
        </div>

        {/* Copy */}
        <div className="relative fade-up" style={{ animationDelay: '.15s' }}>
          <div aria-hidden className="shimmer-line mb-6" style={{ height: 2, width: 92 }} />
          <h2
            className="font-black uppercase leading-[0.92]"
            style={{
              fontFamily: 'var(--font-outfit)',
              fontSize: 'clamp(30px, 3.1vw, 46px)',
              letterSpacing: '-0.035em',
              color: 'var(--text-primary)',
            }}
          >
            Every step,
            <br />
            tracked.
          </h2>
          <p className="mt-4 text-sm leading-relaxed max-w-sm" style={{ color: 'var(--text-muted)' }}>
            Your orders, addresses and saved pairs — all in one place.
          </p>

          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8">
            {[
              ['Free shipping', `Over ₹${settings.freeShippingOver.toLocaleString('en-IN')}`],
              ['Easy returns', `${SITE.returnWindowDays} days`],
              ['Genuine', '100% authentic'],
            ].map(([label, value]) => (
              <div key={label}>
                <p
                  className="text-sm font-black uppercase"
                  style={{ fontFamily: 'var(--font-outfit)', color: 'var(--accent)', letterSpacing: '-0.01em' }}
                >
                  {value}
                </p>
                <p
                  className="text-[11px] font-bold uppercase tracking-widest mt-0.5"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

function NoticeNote({ message }: { message: string }) {
  return (
    <p
      className="flex items-start gap-2 text-xs px-4 py-3 leading-relaxed"
      style={{
        background: 'color-mix(in srgb, var(--success) 12%, transparent)',
        color: 'var(--success)',
        borderRadius: 10,
      }}
    >
      <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      {message}
    </p>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="text-xs px-4 py-3 leading-relaxed"
      style={{
        background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
        color: 'var(--danger)',
        borderRadius: 10,
      }}
    >
      {message}
    </p>
  )
}

export default LoginPage
