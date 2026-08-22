'use client'

import LegalLayout, { LegalSection, LegalList } from '@/components/LegalLayout'
import { SITE } from '@/data/site'

/**
 * Required as a standalone, public URL by Meta for any app offering Facebook
 * Login (Settings → Facebook Login → "Data Deletion Instructions URL") —
 * this is the page that URL points to. Same applies to Google's equivalent
 * requirement for apps requesting user data.
 */
export function DataDeletionPage() {
  return (
    <LegalLayout
      title="Data Deletion Instructions"
      lede="How to have your account and the data attached to it removed from Diamond Stepss — including if you signed in with Google or Facebook."
      updated="18 August 2026"
    >
      <LegalSection title="How to request deletion">
        <p>
          Email {SITE.email} from the address your account is registered under, with the subject
          line &quot;Data deletion request&quot;. If you signed in with Google or Facebook, use the
          email address associated with that account.
        </p>
        <p>
          We reply to confirm we&apos;ve received the request, then complete the deletion and confirm
          again once it&apos;s done — within 30 days, same as any other privacy request under our{' '}
          <a href="/privacy-policy-2" style={{ color: 'var(--accent)' }} className="underline">
            Privacy Policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="What gets deleted">
        <LegalList
          items={[
            <>Your profile — name, email, phone number.</>,
            <>Saved addresses and wishlist.</>,
            <>The account itself, including your sign-in method.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="What we keep, and why">
        <p>
          Placed orders and invoices are retained even after account deletion — Indian tax law
          requires us to keep transaction records for eight years, and we can&apos;t selectively
          erase a real financial record on request. That data is disconnected from your login the
          moment the account is deleted; it isn&apos;t used for anything beyond what the law requires
          of us.
        </p>
      </LegalSection>

      <LegalSection title="Signing in with Google or Facebook">
        <p>
          Deleting your Diamond Stepss account only removes what we stored — your name, email and
          order history with us. It does not touch your actual Google or Facebook account, and
          doesn&apos;t revoke anything on their side. To remove Diamond Stepss&apos;s access from
          your Google or Facebook account directly, do that from that provider&apos;s own account
          settings (Google: Security → Third-party apps with account access; Facebook: Settings &amp;
          privacy → Apps and websites).
        </p>
      </LegalSection>

      <LegalSection title="Questions">
        <p>
          Write to {SITE.email} or call {SITE.phone} if anything above isn&apos;t clear before you
          send a request.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}

export default DataDeletionPage
