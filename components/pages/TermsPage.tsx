'use client'

import Link from 'next/link'
import LegalLayout, { LegalSection, LegalList } from '@/components/LegalLayout'
import { SITE, ADDRESS_ONE_LINE } from '@/data/site'

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      lede="The agreement between you and Diamond Stepss when you shop on this site."
      updated="26 July 2026"
    >
      <LegalSection title="Agreement">
        <p>
          By browsing or ordering from diamondstepss.com you agree to these terms. The site is operated by{' '}
          {SITE.legalName}, {ADDRESS_ONE_LINE}. If you do not agree with any part of these terms, please do not use
          the site.
        </p>
      </LegalSection>

      <LegalSection title="Products and authenticity">
        <LegalList
          items={[
            <>
              Every product we sell is authentic and sourced through authorised channels. Each item ships in its
              original packaging with tags intact.
            </>,
            <>
              Product photographs are representative. Slight variation in colour between a screen and the physical
              product is normal and is not grounds for a defect claim.
            </>,
            <>
              Stock is limited and sizes sell out. Adding an item to your cart does not reserve it until payment is
              completed.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Pricing and payment">
        <LegalList
          items={[
            <>All prices are in Indian Rupees and are the final amount payable — no tax is added at checkout.</>,
            <>
              Payments are processed by Instamojo. We accept UPI, credit and debit cards, net banking and wallets, as
              well as Cash on Delivery.
            </>,
            <>
              We may offer a {SITE.prepaidDiscountPct}% discount on prepaid orders over ₹{SITE.prepaidDiscountMinOrder}.
              COD orders carry a ₹{SITE.codFee} handling fee.
            </>,
            <>
              Where you choose the partial-COD option, the ₹{SITE.partialCodAdvance} advance is non-refundable if
              you refuse the parcel at delivery, as set out in our{' '}
              <Link href="/shipping-policy" style={{ color: 'var(--accent)' }} className="underline">
                Shipping Policy
              </Link>
              .
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Pricing errors">
        <p>
          We take care to price everything correctly, but errors occasionally happen. If an item is listed at an
          obviously incorrect price, we reserve the right to cancel the order and refund you in full rather than
          fulfil it at that price. We will always contact you first.
        </p>
      </LegalSection>

      <LegalSection title="Order acceptance">
        <p>
          Your order is an offer to buy. We accept it when we dispatch the goods. We may decline or cancel an order
          where an item is out of stock, the delivery address is not serviceable, payment fails verification, or we
          reasonably suspect fraudulent or abusive activity — including repeated refusal of COD deliveries.
        </p>
      </LegalSection>

      <LegalSection title="Returns">
        <p>
          Returns and exchanges are governed by our{' '}
          <Link href="/return-policy" style={{ color: 'var(--accent)' }} className="underline">
            Returns &amp; Exchanges policy
          </Link>
          , which forms part of these terms. In short: {SITE.returnWindowDays} days from delivery, unworn, tags on,
          original box.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You are responsible for the accuracy of the details on your account and for activity carried out through
          it. Since we authenticate by OTP, keep your registered mobile number secure and tell us immediately if it
          changes or is compromised.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The Diamond Stepss name, logo, site design, photography and copy belong to us and may not be reproduced
          without written permission. Third-party brand names and logos shown on this site remain the property of
          their respective owners and are used to identify the products we stock.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          Our liability in connection with any order is limited to the amount you paid for that order. We are not
          liable for indirect or consequential losses, or for delays caused by events outside our control such as
          courier disruption, natural events or civil disturbance.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of India. Any dispute is subject to the exclusive jurisdiction of the
          courts at Jalandhar, Punjab.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms? Email {SITE.email} or call {SITE.phone}, {SITE.hours}.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}


export default TermsPage
