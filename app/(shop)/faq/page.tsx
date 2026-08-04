import type { Metadata } from 'next'
import FAQPage from '@/components/pages/FAQPage'
import { FAQ_ITEMS } from '@/data/faq'
import { faqJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers on payment, COD, delivery times, sizing, returns and authenticity.',
}

export default function Page() {
  // Built from the same GROUPS the page renders, so the markup always matches
  // what a visitor actually sees — which is Google's requirement for FAQPage.
  const items = FAQ_ITEMS

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd(items)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'FAQ', path: '/faq' },
            ]),
          ),
        }}
      />
      <FAQPage />
    </>
  )
}
