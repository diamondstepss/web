import type { Metadata } from 'next'
import FAQPage from '@/components/pages/FAQPage'
import { faqItems } from '@/data/faq'
import { getStoreSettings } from '@/lib/settings'
import { faqJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers on payment, COD, delivery times, sizing, returns and authenticity.',
}

export default async function Page() {
  // Built from the same groups the page renders, so the markup always matches
  // what a visitor actually sees — which is Google's requirement for FAQPage.
  const settings = await getStoreSettings()
  const items = faqItems(settings)

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
      <FAQPage settings={settings} />
    </>
  )
}
