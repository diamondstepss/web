'use client'

import Link from 'next/link'
import { RotateCcw, Ruler, XCircle, Clock } from 'lucide-react'
import LegalLayout, { LegalSection, LegalList } from '@/components/LegalLayout'
import { SITE } from '@/data/site'

const STEPS = [
  {
    n: 1,
    title: 'Raise the request',
    body: `Go to your account, open the order and choose Return or Exchange within ${SITE.returnWindowDays} days of delivery.`,
  },
  {
    n: 2,
    title: 'We arrange pickup',
    body: 'Our courier collects the parcel from your address, usually within 2–3 working days. Reverse pickup is free.',
  },
  {
    n: 3,
    title: 'Quality check',
    body: 'Once the item reaches us we inspect it against the condition rules below. This takes 1–2 working days.',
  },
  {
    n: 4,
    title: 'Refund or exchange',
    body: 'Exchanges ship immediately. Refunds are issued to the original payment method within 5–7 working days.',
  },
]

export function ReturnsPolicyPage() {
  return (
    <LegalLayout
      title="Returns & Exchanges"
      lede={`Wrong size or changed your mind? You have ${SITE.returnWindowDays} days from delivery to send it back.`}
      updated="26 July 2026"
    >
      <LegalSection title="How it works">
        <div className="grid sm:grid-cols-2 gap-3 not-prose">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex items-center justify-center text-xs font-black text-white"
                style={{ width: 24, height: 24, background: 'var(--accent)' }}
              >
                {s.n}
              </div>
              <p
                className="mt-3 text-sm font-bold"
                style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}
              >
                {s.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </LegalSection>

      <LegalSection title="What we accept">
        <LegalList
          items={[
            <>
              <RotateCcw size={13} className="inline mr-1.5" style={{ color: 'var(--success)' }} />
              Unworn, unwashed footwear in original condition with all tags attached.
            </>,
            <>The original shoe box, undamaged, along with any dust bags, laces or inserts it came with.</>,
            <>Items returned within {SITE.returnWindowDays} days of the delivery date.</>,
            <>Wrong item delivered, or an item that arrived damaged or defective — always accepted, no questions.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="What we can't accept">
        <LegalList
          items={[
            <>
              <XCircle size={13} className="inline mr-1.5" style={{ color: 'var(--danger)' }} />
              Shoes with visible wear on the sole — try them on indoors, on a clean surface.
            </>,
            <>Items missing their box, tags, or original packaging.</>,
            <>Socks and innerwear, which cannot be returned for hygiene reasons.</>,
            <>Items marked Final Sale on the product page.</>,
            <>Requests raised after the {SITE.returnWindowDays}-day window has closed.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Exchanges">
        <p>
          The most common reason for a return is sizing, so exchanges for a different size in the same style are
          free and prioritised — we dispatch the replacement as soon as the original is picked up, rather than
          waiting for it to reach us.
        </p>
        <p>
          <Ruler size={13} className="inline mr-1.5" style={{ color: 'var(--accent)' }} />
          Check the{' '}
          <Link href="/size-guide" style={{ color: 'var(--accent)' }} className="underline">
            Size Guide
          </Link>{' '}
          before ordering — it has a UK/EU/US/cm conversion table and instructions for measuring your foot at home.
        </p>
      </LegalSection>

      <LegalSection title="Refund timelines">
        <LegalList
          items={[
            <>
              <Clock size={13} className="inline mr-1.5" style={{ color: 'var(--text-muted)' }} />
              Prepaid orders: refunded to the original payment method in 5–7 working days after the quality check.
            </>,
            <>
              COD orders: refunded by bank transfer to an account you provide, in 5–7 working days after the quality
              check.
            </>,
            <>
              Partial COD orders: the amount you paid on delivery is refunded in full. The ₹{SITE.partialCodAdvance}{' '}
              shipping advance is refunded only if the return is due to our error.
            </>,
            <>Shipping charges already paid are refunded only where the return is due to our error.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          Message us on WhatsApp at {SITE.phone} or email {SITE.email}. We're available {SITE.hours}.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}


export default ReturnsPolicyPage
