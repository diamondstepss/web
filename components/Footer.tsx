'use client'

import Link from 'next/link'
import { MapPin, MessageCircle, Send, Loader2, Check } from 'lucide-react'
import { useState } from 'react'
import { SITE } from '@/data/site'
import { InstagramIcon, FacebookIcon, WhatsAppIcon, GoogleMapsIcon } from '@/components/SocialIcons'
import { PAYMENT_MARKS } from '@/components/PaymentIcons'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  const [note, setNote] = useState('')

  /**
   * Previously this only ran `alert('Thanks for subscribing!')` and stored
   * nothing, so every address entered was lost. It now posts to the API and
   * reports failure honestly rather than always claiming success.
   */
  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'busy') return
    setState('busy')
    setNote('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      })
      const data = (await res.json()) as { ok?: boolean; alreadySubscribed?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setState('error')
        setNote(data.error ?? 'We could not sign you up just now.')
        return
      }
      setState('done')
      setNote(data.alreadySubscribed ? 'You are already on the list.' : 'You are on the list.')
      setEmail('')
    } catch {
      setState('error')
      setNote('Check your connection and try again.')
    }
  }

  return (
    <footer className="site-footer">
      {/* Newsletter band */}
      {/* Its own padding rather than .section-pad — 96px is tuned for full
          content sections and left this two-line band mostly empty space. */}
      <div className="newsletter-band py-12 md:py-14">
        <div className="mx-auto max-w-[1440px] px-6 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div>
            <h3
              className="text-2xl md:text-3xl font-black uppercase tracking-tight"
              style={{ fontFamily: 'Outfit', color: 'var(--f-text)', letterSpacing: '-0.02em' }}
            >
              GET FIRST ACCESS
            </h3>
            <p className="mt-1 text-sm" style={{ color: 'var(--f-muted)' }}>
              New drops, exclusive deals, and early access — straight to your inbox.
            </p>
            {/* Sits with the copy it belongs to. Centred, it read as an orphan
                floating between the left heading and the right-hand form. */}
            <p className="mt-2.5 text-xs" style={{ color: 'var(--f-muted)', opacity: 0.75 }}>
              By subscribing you agree to our Privacy Policy. Unsubscribe anytime.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Your email address"
                aria-invalid={state === 'error'}
                className="flex-1 md:w-64 px-4 py-3 text-sm outline-none"
                style={{
                  background: 'var(--f-surface)',
                  color: 'var(--f-text)',
                  border: `1px solid ${state === 'error' ? 'var(--f-accent)' : 'var(--f-line)'}`,
                  borderRadius: 'var(--radius-btn)',
                }}
              />
              <button
                type="submit"
                disabled={state === 'busy'}
                className="px-4 py-3 text-white flex items-center justify-center transition-opacity hover:opacity-90"
                style={{
                  background: 'var(--f-accent)',
                  borderRadius: 'var(--radius-btn)',
                  opacity: state === 'busy' ? 0.6 : 1,
                }}
                aria-label="Subscribe"
              >
                {state === 'busy' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>

            {/* Outcome is announced, not assumed — a failed signup used to look
                identical to a successful one. */}
            {note && (
              <p
                role="status"
                className="flex items-center gap-1.5 mt-2 text-xs"
                style={{ color: state === 'error' ? 'var(--f-accent)' : 'var(--f-muted)' }}
              >
                {state === 'done' && <Check size={13} />}
                {note}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-[1440px] px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Shop */}
          <div>
            <h4
              className="text-xs font-bold tracking-widest uppercase mb-5"
              style={{ color: 'var(--f-muted)', fontFamily: 'Outfit' }}
            >
              Shop
            </h4>
            {[
              ['Sneakers', '/product-category/sneakers'],
              ['Sports Shoes', '/product-category/sports-shoes'],
              ['Running Shoes', '/product-category/running-shoes'],
              ['Loafers', '/product-category/loafers'],
              ['Chelsea Boots', '/product-category/chelsea-boot'],
              ['Leather Shoes', '/product-category/leather-shoes'],
              ['Slippers', '/product-category/slippers'],
              ['Accessories', '/product-category/accessories'],
              ['Sale', '/product-category/sale'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="block py-1.5 text-sm transition-colors duration-200"
                style={{ color: 'var(--f-muted)' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--f-text)')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--f-muted)')}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Help */}
          <div>
            <h4
              className="text-xs font-bold tracking-widest uppercase mb-5"
              style={{ color: 'var(--f-muted)', fontFamily: 'Outfit' }}
            >
              Help
            </h4>
            {[
              ['Order Tracking', '/order-tracking'],
              ['Shipping Policy', '/shipping-policy'],
              ['Returns & Exchanges', '/return-policy'],
              ['Size Guide', '/size-guide'],
              ['FAQ', '/faq'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="block py-1.5 text-sm transition-colors duration-200"
                style={{ color: 'var(--f-muted)' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--f-text)')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--f-muted)')}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4
              className="text-xs font-bold tracking-widest uppercase mb-5"
              style={{ color: 'var(--f-muted)', fontFamily: 'Outfit' }}
            >
              Company
            </h4>
            {[
              ['About Us', '/about-us'],
              ['Contact', '/contact'],
              ['Terms of Service', '/terms-and-conditions'],
              ['Privacy Policy', '/privacy-policy-2'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="block py-1.5 text-sm transition-colors duration-200"
                style={{ color: 'var(--f-muted)' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--f-text)')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--f-muted)')}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-xs font-bold tracking-widest uppercase mb-5"
              style={{ color: 'var(--f-muted)', fontFamily: 'Outfit' }}
            >
              Contact
            </h4>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--f-muted)' }}>
              {SITE.address.line1}
              <br />
              {SITE.address.line2}
              <br />
              {`${SITE.address.city} ${SITE.address.pincode}, ${SITE.address.state}, ${SITE.address.country}`}
            </p>
            <a
              href={SITE.phoneHref}
              className="block text-sm mb-1 transition-colors duration-200"
              style={{ color: 'var(--f-muted)' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--f-text)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--f-muted)')}
            >
              {SITE.phone}
            </a>
            <a
              href="mailto:support@diamondstepss.com"
              className="block text-sm mb-4 transition-colors duration-200"
              style={{ color: 'var(--f-muted)' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--f-text)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--f-muted)')}
            >
              support@diamondstepss.com
            </a>
            <p className="text-xs" style={{ color: 'var(--f-muted)' }}>
              Mon–Sat, 10 AM – 7 PM IST
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-5">
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded transition-colors duration-200"
                style={{ background: 'var(--f-surface)', color: 'var(--f-muted)' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'var(--f-accent)'
                  el.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'var(--f-surface)'
                  el.style.color = 'var(--f-muted)'
                }}
                aria-label="Instagram"
              >
                <InstagramIcon size={17} />
              </a>
              <a
                href={SITE.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded transition-colors duration-200"
                style={{ background: 'var(--f-surface)', color: 'var(--f-muted)' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'var(--f-accent)'
                  el.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'var(--f-surface)'
                  el.style.color = 'var(--f-muted)'
                }}
                aria-label="Facebook"
              >
                <FacebookIcon size={17} />
              </a>
              <a
                href={SITE.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded transition-colors duration-200"
                style={{ background: 'var(--f-surface)', color: 'var(--f-muted)' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = '#25d366'
                  el.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'var(--f-surface)'
                  el.style.color = 'var(--f-muted)'
                }}
                aria-label="WhatsApp"
              >
                <WhatsAppIcon size={17} />
              </a>
              <a
                href={SITE.social.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded transition-colors duration-200"
                style={{ background: 'var(--f-surface)', color: 'var(--f-muted)' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.background = '#4285f4'
                  el.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.background = 'var(--f-surface)'
                  el.style.color = 'var(--f-muted)'
                }}
                aria-label="Google Maps"
              >
                <GoogleMapsIcon size={17} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t"
        style={{ borderColor: 'var(--f-line)' }}
      >
        <div className="mx-auto max-w-[1440px] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'var(--f-muted)' }}>
            © 2026 Diamond Stepss. All rights reserved.
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {PAYMENT_MARKS.map((Mark, i) => (
              <Mark key={i} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
