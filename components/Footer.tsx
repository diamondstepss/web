'use client'

import Link from 'next/link'
import { MapPin, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'
import { SITE } from '@/data/site'
import { InstagramIcon, FacebookIcon, WhatsAppIcon, GoogleMapsIcon } from '@/components/SocialIcons'
import { PAYMENT_MARKS } from '@/components/PaymentIcons'

export default function Footer() {
  const [email, setEmail] = useState('')

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    setEmail('')
    alert('Thanks for subscribing!')
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
          <form onSubmit={handleNewsletter} className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 md:w-64 px-4 py-3 text-sm outline-none"
              style={{
                background: 'var(--f-surface)',
                color: 'var(--f-text)',
                border: '1px solid var(--f-line)',
                borderRadius: 'var(--radius-btn)',
              }}
            />
            <button
              type="submit"
              className="px-4 py-3 text-white flex items-center justify-center transition-opacity hover:opacity-90"
              style={{ background: 'var(--f-accent)', borderRadius: 'var(--radius-btn)' }}
              aria-label="Subscribe"
            >
              <Send size={16} />
            </button>
          </form>
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
              Shop No 3, Main Road, Ladhewali Road
              <br />
              Jalandhar 144007, Punjab, India
            </p>
            <a
              href="tel:+917888522353"
              className="block text-sm mb-1 transition-colors duration-200"
              style={{ color: 'var(--f-muted)' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--f-text)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--f-muted)')}
            >
              +91 78885 22353
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
