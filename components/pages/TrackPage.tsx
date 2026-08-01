'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Copy,
  MessageCircle,
  ArrowRight,
  Search,
  Loader2,
} from 'lucide-react'
import { SITE } from '@/data/site'

const TIMELINE = [
  { label: 'Order placed', detail: 'We received your order', at: '20 Jul, 11:42 AM', done: true },
  { label: 'Packed', detail: 'Packed at our Jalandhar store', at: '20 Jul, 4:10 PM', done: true },
  { label: 'Shipped', detail: 'Picked up by Bluedart', at: '21 Jul, 9:25 AM', done: true },
  { label: 'Out for delivery', detail: 'Arriving today, by 7 PM', at: 'Expected 23 Jul', done: false },
  { label: 'Delivered', detail: 'Cash to collect: ₹2,199', at: '—', done: false },
]

export function TrackPage() {
  const [orderNum, setOrderNum] = useState('')
  const [phone, setPhone] = useState('')
  const [tracked, setTracked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const awb = '7712 0043 9981'
  const ready = orderNum.trim() && phone.trim()

  const field = {
    height: 54,
    background: 'color-mix(in srgb, var(--accent) 7%, var(--surface))',
    border: '1px solid transparent',
    borderRadius: 12,
    color: 'var(--text-primary)',
    transition: 'border-color .2s ease',
  } as const

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    setBusy(true)
    // Stands in for the Shiprocket lookup until checkout creates real orders.
    setTimeout(() => {
      setBusy(false)
      setTracked(true)
    }, 700)
  }

  return (
    <div className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Ambient field, no hard banner edge */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: 720,
          background:
            'radial-gradient(58% 70% at 15% 0%, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="absolute orb-drift pointer-events-none"
        style={{
          top: -220,
          right: -80,
          width: 560,
          height: 560,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 68%)',
          filter: 'blur(12px)',
        }}
      />

      <section className="relative mx-auto max-w-[1440px] px-6 pt-16 pb-24 lg:pt-20 lg:pb-28">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-12 xl:gap-20 items-center">
          {/* ── Left: copy + form ─────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-3 mb-5 fade-up">
              <span aria-hidden className="shimmer-line" style={{ height: 2, width: 34 }} />
              <span
                className="text-xs font-black uppercase tracking-[0.2em]"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-outfit)' }}
              >
                Where&apos;s my order
              </span>
            </div>

            <h1
              className="font-black uppercase leading-[0.88] fade-up"
              style={{
                fontFamily: 'var(--font-outfit)',
                fontSize: 'clamp(40px, 6.5vw, 72px)',
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                animationDelay: '.06s',
              }}
            >
              Track your
              <br />
              order
            </h1>

            <p
              className="mt-5 text-base leading-relaxed fade-up"
              style={{ color: 'var(--text-muted)', maxWidth: 430, animationDelay: '.12s' }}
            >
              Order number and the mobile number you ordered with. No account needed.
            </p>

            <form
              onSubmit={submit}
              className="mt-9 p-6 sm:p-7 fade-up"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                boxShadow: '0 24px 60px -30px rgba(0,0,0,0.45)',
                maxWidth: 460,
                animationDelay: '.18s',
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="ord"
                    className="block text-xs font-semibold mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Order number
                  </label>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                    <input
                      id="ord"
                      value={orderNum}
                      onChange={(e) => setOrderNum(e.target.value)}
                      placeholder="DS-2026-004756"
                      className="w-full pl-11 pr-4 text-base sm:text-sm outline-none"
                      style={{ ...field, borderColor: orderNum ? 'var(--accent)' : 'transparent' }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="tel"
                    className="block text-xs font-semibold mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Mobile number
                  </label>
                  <input
                    id="tel"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 text-base sm:text-sm outline-none"
                    style={{ ...field, borderColor: phone ? 'var(--accent)' : 'transparent' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!ready || busy}
                  className="group w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white"
                  style={{
                    height: 52,
                    borderRadius: 99,
                    background: 'var(--accent)',
                    fontFamily: 'var(--font-outfit)',
                    opacity: !ready || busy ? 0.5 : 1,
                    cursor: !ready || busy ? 'not-allowed' : 'pointer',
                    boxShadow: !ready || busy ? 'none' : '0 12px 26px -12px var(--accent)',
                    transition: 'opacity .2s ease, box-shadow .2s ease',
                  }}
                >
                  {busy ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Looking up
                    </>
                  ) : (
                    <>
                      Track order
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>

              <p className="mt-5 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                Have an account?{' '}
                <Link href="/my-account" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                  See all your orders
                </Link>
              </p>
            </form>
          </div>

          {/* ── Right: live tracking card ──────────────────────────── */}
          <div className="relative fade-up" style={{ animationDelay: '.24s' }}>
            {!tracked ? (
              <PreviewCard />
            ) : (
              <ResultCard
                orderNum={orderNum || 'DS-2026-004756'}
                awb={awb}
                copied={copied}
                onCopy={() => {
                  navigator.clipboard?.writeText(awb.replace(/\s/g, ''))
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1600)
                }}
                onReset={() => setTracked(false)}
              />
            )}
          </div>
        </div>
      </section>

      {/* ── Help strip ───────────────────────────────────────────── */}
      <section
        className="relative"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-14 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Truck,
              title: 'Dispatched daily',
              body: `Orders placed before 2 PM ship the same working day, from ${SITE.address.city}.`,
            },
            {
              icon: Package,
              title: `Delivered in ${SITE.deliveryDays}`,
              body: 'You get an SMS and WhatsApp with a live link the moment it is picked up.',
            },
            {
              icon: MessageCircle,
              title: 'Stuck somewhere?',
              body: `Message us on WhatsApp — we reply within minutes, ${SITE.hours}.`,
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <span
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                  color: 'var(--accent)',
                }}
              >
                <Icon size={19} />
              </span>
              <div>
                <p
                  className="text-sm font-black uppercase tracking-wide"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}
                >
                  {title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/** Shown before a lookup — a real example, so the space is never empty. */
function PreviewCard() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 40%, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 70%)',
          filter: 'blur(12px)',
        }}
      />
      <div
        className="relative overflow-hidden float-soft"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: '0 40px 80px -40px rgba(0,0,0,0.55)',
        }}
      >
        <div className="relative" style={{ height: 190 }}>
          <Image
            src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&h=500&fit=crop&auto=format"
            alt=""
            aria-hidden
            fill
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, transparent 30%, var(--surface) 100%)' }}
          />
          <span
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white"
            style={{ background: '#3b82f6', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
          >
            <Truck size={12} /> In transit
          </span>
        </div>

        <div className="px-6 pb-6 -mt-4 relative">
          <p
            className="text-xs font-black uppercase tracking-widest mb-1"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
          >
            Example
          </p>
          <p
            className="text-lg font-black"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em' }}
          >
            #DS-2026-004756
          </p>

          <div className="mt-6 space-y-0">
            {TIMELINE.map((t, i) => {
              const last = i === TIMELINE.length - 1
              return (
                <div key={t.label} className="flex gap-3.5">
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: 22,
                        height: 22,
                        background: t.done ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      {t.done ? (
                        <CheckCircle2 size={12} color="#fff" />
                      ) : (
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--text-muted)' }} />
                      )}
                    </span>
                    {!last && (
                      <span
                        style={{
                          width: 2,
                          flex: 1,
                          minHeight: 26,
                          background: TIMELINE[i + 1].done ? 'var(--accent)' : 'var(--border)',
                        }}
                      />
                    )}
                  </div>
                  <div className={last ? 'pb-0' : 'pb-4'}>
                    <p
                      className="text-sm font-bold"
                      style={{ color: t.done ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {t.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {t.at}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultCard({
  orderNum,
  awb,
  copied,
  onCopy,
  onReset,
}: {
  orderNum: string
  awb: string
  copied: boolean
  onCopy: () => void
  onReset: () => void
}) {
  return (
    <div
      className="fade-up overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        boxShadow: '0 40px 80px -40px rgba(0,0,0,0.55)',
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-5"
        style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}
      >
        <div>
          <p
            className="text-base font-black"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em' }}
          >
            #{orderNum}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Placed 20 Jul 2026 · Partial COD
          </p>
        </div>
        <span
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white"
          style={{ background: '#3b82f6', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
        >
          <Truck size={12} /> In transit
        </span>
      </div>

      <div className="px-6 py-5 flex flex-wrap gap-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          ['Courier', 'Bluedart'],
          ['Expected', '23 Jul 2026'],
        ].map(([k, v]) => (
          <div key={k}>
            <p
              className="text-[11px] font-black uppercase tracking-widest mb-1"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
            >
              {k}
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {v}
            </p>
          </div>
        ))}
        <div>
          <p
            className="text-[11px] font-black uppercase tracking-widest mb-1"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
          >
            AWB
          </p>
          <button onClick={onCopy} className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {awb}
            <Copy size={13} style={{ color: copied ? 'var(--success)' : 'var(--accent)' }} />
            {copied && (
              <span className="text-xs font-bold" style={{ color: 'var(--success)' }}>
                Copied
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {TIMELINE.map((t, i) => {
          const last = i === TIMELINE.length - 1
          return (
            <div key={t.label} className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 26, height: 26, background: t.done ? 'var(--accent)' : 'var(--border)' }}
                >
                  {t.done ? (
                    <CheckCircle2 size={14} color="#fff" />
                  ) : (
                    <Package size={13} style={{ color: 'var(--text-muted)' }} />
                  )}
                </span>
                {!last && (
                  <span
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 32,
                      background: TIMELINE[i + 1].done ? 'var(--accent)' : 'var(--border)',
                    }}
                  />
                )}
              </div>
              <div className={last ? '' : 'pb-6'}>
                <p
                  className="text-sm font-black uppercase tracking-wide"
                  style={{
                    color: t.done ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-outfit)',
                  }}
                >
                  {t.label}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {t.detail}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                  {t.at}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="px-6 py-5 flex flex-wrap items-center gap-4"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--hover)' }}
      >
        <div className="flex items-start gap-2 flex-1 min-w-[200px]">
          <MapPin size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Delivering to
            <br />
            <span style={{ color: 'var(--text-primary)' }}>
              204, Green Enclave, Model Town Road, Jalandhar 144003
            </span>
          </p>
        </div>
        <a
          href={SITE.social.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white"
          style={{ background: '#25d366', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
        >
          <MessageCircle size={14} /> Get help
        </a>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 text-[11px] font-black uppercase tracking-widest"
        style={{ color: 'var(--accent)', fontFamily: 'var(--font-outfit)', borderTop: '1px solid var(--border)' }}
      >
        Track another order
      </button>
    </div>
  )
}

export default TrackPage
