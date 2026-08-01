'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  MessageCircle,
  CreditCard,
  Truck,
  Ruler,
  ShieldCheck,
  Phone,
  Mail,
} from 'lucide-react'
import PageHero from '@/components/PageHero'
import { SITE } from '@/data/site'

const GROUPS = [
  {
    id: 'payment',
    icon: CreditCard,
    group: 'Orders & Payment',
    items: [
      {
        q: 'Which payment methods do you accept?',
        a: 'UPI (GPay, PhonePe, Paytm), credit and debit cards, net banking, and wallets — all processed securely by Cashfree. Cash on Delivery is available too.',
      },
      {
        q: 'What is Partial COD?',
        a: `Partial COD lets you pay a small advance of ₹${SITE.partialCodAdvance} online and the balance in cash on delivery. The advance covers shipping and is non-refundable if you refuse the parcel at the door.`,
      },
      {
        q: 'Is there a discount for paying online?',
        a: `Yes — prepaid orders get an extra ${SITE.prepaidDiscountPct}% off, and you skip the ₹${SITE.codFee} COD handling fee. It is the cheapest way to order.`,
      },
      {
        q: 'Can I cancel after ordering?',
        a: 'Yes, any time before dispatch, from your account or by WhatsApp. Once the parcel is handed to the courier it has to go through the returns process instead.',
      },
    ],
  },
  {
    id: 'shipping',
    icon: Truck,
    group: 'Shipping & Delivery',
    items: [
      {
        q: 'How long will delivery take?',
        a: `Typically ${SITE.deliveryDays} from dispatch. We ship from Jalandhar and cover every serviceable pincode in India. Enter your pincode on any product page for an exact estimate.`,
      },
      {
        q: 'How much is shipping?',
        a: `Free on orders over ₹${SITE.freeShippingOver}. Below that, a flat ₹99 applies and is always shown in the cart before you pay.`,
      },
      {
        q: 'How do I track my order?',
        a: 'You get an SMS and WhatsApp with a tracking link as soon as the courier collects your parcel. You can also track it from your account, or from the Track Order page using your order number and phone.',
      },
    ],
  },
  {
    id: 'sizing',
    icon: Ruler,
    group: 'Sizing & Returns',
    items: [
      {
        q: 'Which size should I order?',
        a: 'We list everything in UK sizes 6 to 11. The Size Guide has a UK/EU/US/cm conversion table and instructions for measuring your foot at home. If you are between sizes, size up.',
      },
      {
        q: 'How do I return or exchange something?',
        a: `Raise a request from your account within ${SITE.returnWindowDays} days of delivery. We arrange a free pickup, run a quick quality check, and then ship your exchange or issue a refund in 5–7 working days.`,
      },
      {
        q: 'What condition must a return be in?',
        a: 'Unworn and unwashed, with all tags attached and in the original box. Try shoes on indoors, on a clean surface — visible sole wear means we cannot accept the return.',
      },
    ],
  },
  {
    id: 'authenticity',
    icon: ShieldCheck,
    group: 'Authenticity',
    items: [
      {
        q: 'Are your products 100% genuine?',
        a: 'Yes. We source through authorised channels only. Every product arrives in original packaging with tags intact.',
      },
      {
        q: 'Do you have a physical store?',
        a: `Yes — ${SITE.address.line1}, ${SITE.address.city}. Open ${SITE.hours}. You're welcome to try before you buy.`,
      },
    ],
  },
]

export function FAQPage() {
  const [open, setOpen] = useState<string | null>('payment-0')
  const [active, setActive] = useState('payment')

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero
        eyebrow="Help centre"
        title="Questions, answered"
        lede="Payment, delivery, sizing and returns — the things customers ask us most."
        crumbs={[{ label: 'FAQ' }]}
        compact
      />

      <section className="mx-auto max-w-[1440px] px-6 pb-24">
        <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-10 xl:gap-16">
          {/* Sticky topic nav */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p
                className="text-[11px] font-black uppercase tracking-[0.2em] mb-4"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
              >
                Topics
              </p>
              <nav className="flex flex-col gap-1">
                {GROUPS.map(({ id, group, icon: Icon }) => {
                  const on = active === id
                  return (
                    <a
                      key={id}
                      href={`#${id}`}
                      onClick={() => setActive(id)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200"
                      style={{
                        borderRadius: 12,
                        background: on ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                        color: on ? 'var(--accent)' : 'var(--text-muted)',
                      }}
                    >
                      <Icon size={16} />
                      {group}
                    </a>
                  )
                })}
              </nav>

              {/* Support card */}
              <div
                className="mt-8 p-5"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                }}
              >
                <p
                  className="text-sm font-black uppercase mb-1.5"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}
                >
                  Still stuck?
                </p>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                  We reply on WhatsApp within minutes, {SITE.hours}.
                </p>
                <a
                  href={SITE.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 text-[11px] font-black uppercase tracking-widest text-white"
                  style={{ background: '#25d366', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
                >
                  <MessageCircle size={14} /> WhatsApp us
                </a>
              </div>
            </div>
          </aside>

          {/* Accordions */}
          <div className="space-y-10">
            {GROUPS.map(({ id, group, icon: Icon, items }) => (
              <div key={id} id={id} className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 11,
                      background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                      color: 'var(--accent)',
                    }}
                  >
                    <Icon size={18} />
                  </span>
                  <h2
                    className="text-xl md:text-2xl font-black uppercase"
                    style={{
                      fontFamily: 'var(--font-outfit)',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {group}
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, i) => {
                    const key = `${id}-${i}`
                    const isOpen = open === key
                    return (
                      <div
                        key={key}
                        style={{
                          background: 'var(--surface)',
                          border: `1px solid ${isOpen ? 'color-mix(in srgb, var(--accent) 40%, var(--border))' : 'var(--border)'}`,
                          borderRadius: 14,
                          transition: 'border-color .2s ease',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => setOpen(isOpen ? null : key)}
                          aria-expanded={isOpen}
                          className="flex items-start justify-between gap-4 w-full text-left px-5 py-4"
                        >
                          <span
                            className="text-sm md:text-[15px] font-bold"
                            style={{ color: isOpen ? 'var(--accent)' : 'var(--text-primary)' }}
                          >
                            {item.q}
                          </span>
                          <ChevronDown
                            size={17}
                            className="shrink-0 transition-transform duration-200"
                            style={{
                              color: isOpen ? 'var(--accent)' : 'var(--text-muted)',
                              transform: isOpen ? 'rotate(180deg)' : 'none',
                              marginTop: 2,
                            }}
                          />
                        </button>
                        {isOpen && (
                          <p
                            className="px-5 pb-5 -mt-1 text-sm leading-relaxed"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {item.a}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Contact strip — replaces the old empty CTA band */}
            <div
              className="grid sm:grid-cols-3 gap-3 pt-4"
            >
              {[
                { icon: MessageCircle, label: 'WhatsApp', value: SITE.phone, href: SITE.social.whatsapp, tint: '#25d366' },
                { icon: Phone, label: 'Call us', value: SITE.phone, href: SITE.phoneHref, tint: 'var(--accent)' },
                { icon: Mail, label: 'Email', value: SITE.email, href: `mailto:${SITE.email}`, tint: 'var(--accent)' },
              ].map(({ icon: Icon, label, value, href, tint }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="p-5 transition-transform duration-200 hover:-translate-y-1"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}
                >
                  <Icon size={18} style={{ color: tint }} />
                  <p
                    className="mt-3 text-[11px] font-black uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
                  >
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-bold break-all" style={{ color: 'var(--text-primary)' }}>
                    {value}
                  </p>
                </a>
              ))}
            </div>

            <p className="text-sm text-center pt-2" style={{ color: 'var(--text-muted)' }}>
              Prefer a form?{' '}
              <Link href="/contact" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default FAQPage
