'use client'

import { Truck, PackageCheck, IndianRupee, MapPin } from 'lucide-react'
import LegalLayout, { LegalSection, LegalList } from '@/components/LegalLayout'
import { SITE, ADDRESS_ONE_LINE } from '@/data/site'

const HIGHLIGHTS = [
  { icon: Truck, label: 'Free shipping', value: `On orders over ₹${SITE.freeShippingOver}` },
  { icon: PackageCheck, label: 'Delivery time', value: SITE.deliveryDays },
  { icon: IndianRupee, label: 'COD fee', value: `₹${SITE.codFee} per order` },
  { icon: MapPin, label: 'Ships from', value: `${SITE.address.city}, ${SITE.address.state}` },
]

export function ShippingPolicyPage() {
  return (
    <LegalLayout
      title="Shipping Policy"
      lede="How and when your order reaches you, what it costs, and what happens if something goes wrong in transit."
      updated="26 July 2026"
    >
      {/* Quick-reference strip — most customers only want these four numbers. */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        {HIGHLIGHTS.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="p-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Icon size={16} style={{ color: 'var(--accent)' }} />
            <p
              className="mt-2.5 text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
            >
              {label}
            </p>
            <p className="mt-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <LegalSection title="Where we deliver">
        <p>
          We ship across India to every pincode serviced by our courier partners. Orders are dispatched from our
          store at {ADDRESS_ONE_LINE}.
        </p>
        <p>
          You can check serviceability and the exact delivery estimate for your area by entering your pincode on
          any product page before you order.
        </p>
      </LegalSection>

      <LegalSection title="Charges">
        <LegalList
          items={[
            <>
              <strong style={{ color: 'var(--text-primary)' }}>Free shipping</strong> on all prepaid and COD orders
              above ₹{SITE.freeShippingOver}.
            </>,
            <>
              Orders at or below ₹{SITE.freeShippingOver} carry a flat ₹99 shipping charge, shown in the cart
              before payment.
            </>,
            <>
              Cash on Delivery adds a ₹{SITE.codFee} handling fee. Choosing to pay online instead removes this fee
              and applies an extra {SITE.prepaidDiscountPct}% discount.
            </>,
            <>The price you see is the price you pay. No taxes or charges are added after checkout.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Dispatch and delivery time">
        <LegalList
          items={[
            <>Orders placed before 2 PM IST on a working day are dispatched the same day.</>,
            <>Orders placed after 2 PM, on Sundays, or on public holidays are dispatched the next working day.</>,
            <>
              Delivery typically takes {SITE.deliveryDays} from dispatch. Remote pincodes and the North-East may
              take 2–3 days longer.
            </>,
            <>
              You receive an SMS and WhatsApp message with your tracking link as soon as the courier picks up your
              parcel.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Paying the shipping advance">
        <p>
          On eligible orders you can choose{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            Pay ₹{SITE.partialCodAdvance} now, balance on delivery
          </strong>
          . The advance covers shipping and handling, and the remaining amount is collected in cash by the courier.
        </p>
        <p style={{ color: 'var(--warning)' }}>
          Please note: the ₹{SITE.partialCodAdvance} advance is non-refundable if the parcel is refused at the door
          or returned undelivered, because the shipping cost has already been incurred.
        </p>
      </LegalSection>

      <LegalSection title="Failed delivery and RTO">
        <LegalList
          items={[
            <>Our courier partners attempt delivery up to three times before returning a parcel to us.</>,
            <>
              Please keep your phone reachable. Undelivered parcels come back to Jalandhar and delay any refund by
              7–10 days.
            </>,
            <>
              If a parcel is returned through no fault of yours, we re-ship it free of charge or refund you in full,
              whichever you prefer.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Damaged or missing parcels">
        <p>
          Please record an unboxing video when you open a parcel — it is the fastest way for us to resolve a claim
          with the courier. If a parcel arrives damaged, tampered with, or short of items, contact us within 48
          hours of delivery at {SITE.email} or on WhatsApp at {SITE.phone} and we will replace it or refund you.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}


export default ShippingPolicyPage
