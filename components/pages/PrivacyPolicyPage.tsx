'use client'

import LegalLayout, { LegalSection, LegalList } from '@/components/LegalLayout'
import { SITE, ADDRESS_ONE_LINE } from '@/data/site'

export function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lede="What we collect when you shop with us, why we collect it, and the control you have over it."
      updated="26 July 2026"
    >
      <LegalSection title="Who we are">
        <p>
          {SITE.legalName} operates diamondstepss.com from {ADDRESS_ONE_LINE}. If you have any question about this
          policy or your data, write to {SITE.email} or call {SITE.phone}.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <LegalList
          items={[
            <>
              <strong style={{ color: 'var(--text-primary)' }}>Contact and delivery details</strong> — your name,
              mobile number, email and shipping address. We need these to deliver your order and cannot fulfil an
              order without them.
            </>,
            <>
              <strong style={{ color: 'var(--text-primary)' }}>Order history</strong> — what you bought, sizes,
              amounts and returns, so we can handle support and warranty claims.
            </>,
            <>
              <strong style={{ color: 'var(--text-primary)' }}>Payment information</strong> — handled entirely by
              our payment gateway. We never see or store your full card number, CVV, UPI PIN or net-banking
              credentials.
            </>,
            <>
              <strong style={{ color: 'var(--text-primary)' }}>Usage data</strong> — pages viewed, device type and
              approximate location from your IP, used to improve the site and measure our advertising.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Who we share it with">
        <p>We share the minimum necessary with the partners who make an order work:</p>
        <LegalList
          items={[
            <>
              <strong style={{ color: 'var(--text-primary)' }}>Instamojo</strong> — to process payments and
              refunds securely.
            </>,
            <>
              <strong style={{ color: 'var(--text-primary)' }}>Shiprocket</strong> and its courier partners — your
              name, address and phone, so your parcel can be delivered.
            </>,
            <>
              <strong style={{ color: 'var(--text-primary)' }}>Google Analytics and Meta</strong> — anonymised usage
              and conversion data to measure advertising performance.
            </>,
            <>
              SMS, WhatsApp and email providers, to send order confirmations and delivery updates.
            </>,
          ]}
        />
        <p>
          We do not sell your personal data to anyone, and we do not share it for any purpose beyond completing and
          supporting your order.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          We use cookies to keep your cart intact between visits, remember whether you prefer the light or dark
          theme, and measure which ads bring people to the store. You can clear or block cookies in your browser
          settings, though your cart will not persist if you do.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Order and invoice records are retained for eight years, as required under Indian tax law. Marketing
          preferences and analytics data are kept for 26 months. You may ask us to delete anything not covered by a
          legal retention requirement.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <LegalList
          items={[
            <>Ask for a copy of the personal data we hold about you.</>,
            <>Have inaccurate details corrected — you can edit most of them yourself under Profile.</>,
            <>Ask us to delete your account and associated data, subject to the retention rules above.</>,
            <>Opt out of marketing messages at any time by replying STOP, without affecting order updates.</>,
          ]}
        />
        <p>
          To exercise any of these, email {SITE.email} from your registered address. We respond within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          The site runs entirely over HTTPS, payment data never touches our servers, and access to customer records
          is limited to staff who need it to do their job. No system is perfectly secure, so if we ever detect a
          breach affecting your data we will notify you promptly.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Our store is not directed at children under 18. If you believe a minor has provided us personal data,
          contact us and we will delete it.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}


export default PrivacyPolicyPage
