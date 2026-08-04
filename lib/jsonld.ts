import { SITE, ADDRESS_ONE_LINE } from '@/data/site'
import type { Product } from './types'

/**
 * Structured data builders.
 *
 * ── On ratings ──────────────────────────────────────────────────────────────
 * Nothing here emits `aggregateRating` or `review`, deliberately. Google's
 * review-snippet documentation says:
 *
 *   "If the entity that's being reviewed controls the reviews about itself,
 *    their pages that use LocalBusiness or any other type of Organization
 *    structured data are ineligible for star review feature."
 *
 *   "Don't aggregate reviews or ratings from other websites."
 *
 * The shop's reviews live on Google, so marking them up here would be both
 * ineligible and a guideline breach. The reviews are still shown to customers
 * on the page — they're just not claimed as structured data.
 *
 * Product-level ratings are excluded for a blunter reason: the per-product
 * review counts on the site are placeholder content, and marking those up
 * would be fabricated review markup, which does draw manual actions.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diamondstepss.com'

/** Escapes `<` so a value containing "</script>" can't close the tag early. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/**
 * The shop, for local search.
 *
 * ShoeStore is a LocalBusiness subtype, so this is what feeds map-pack and
 * "shoe shop near me" style results. The fields that matter most for that are
 * geo, address, openingHoursSpecification, areaServed and hasMap — an address
 * string alone leaves Google to infer a location, which is much weaker.
 *
 * No aggregateRating: see the note at the top of this file.
 */
export function localBusinessJsonLd(
  /**
   * Real categories from the database. Passing them keeps hasOfferCatalog
   * pointing at pages that exist — a hardcoded list produced
   * /product-category/chelsea-boots when the actual slug is `chelsea-boot`,
   * which the catch-all route answers with the whole catalog (a soft 404).
   */
  categories: { slug: string; name: string }[] = [],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ShoeStore',
    '@id': `${SITE_URL}/#business`,
    name: SITE.name,
    alternateName: 'Diamond Steps',
    slogan: SITE.tagline,
    description: ADDRESS_ONE_LINE,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/brand/wide-logo.png`,
      caption: SITE.name,
    },
    // Google's local guidance asks for a photo of the actual premises; the
    // logo is a poor substitute for matching a shopfront in the map pack.
    image: [`${SITE_URL}/brand/storefront.webp`, `${SITE_URL}/brand/wide-logo.png`],
    photo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/brand/storefront.webp`,
      caption: `${SITE.name} storefront, ${SITE.address.city}`,
    },
    telephone: SITE.phone,
    email: SITE.email,
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery',

    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.address.line1,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.pincode,
      addressCountry: 'IN',
    },

    // Read from the Google listing, so the pin here matches the pin there.
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.lat,
      longitude: SITE.geo.lng,
    },
    hasMap: SITE.social.maps,

    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SITE.openDays,
        opens: SITE.opens,
        closes: SITE.closes,
      },
    ],

    // The shop is a physical store in Jalandhar that also ships nationwide,
    // so both the local and the national footprint are declared.
    areaServed: [
      { '@type': 'City', name: SITE.servesCity },
      { '@type': 'State', name: SITE.servesRegion },
      { '@type': 'Country', name: SITE.servesCountry },
    ],

    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: SITE.phone,
      email: SITE.email,
      areaServed: 'IN',
      availableLanguage: ['en', 'hi', 'pa'],
    },

    // What the shop actually sells, so Google can match category queries.
    // Omitted entirely when categories aren't available, rather than guessed.
    ...(categories.length
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Footwear & accessories',
            itemListElement: categories.map((c) => ({
              '@type': 'OfferCatalog',
              name: c.name,
              url: `${SITE_URL}/product-category/${c.slug}`,
            })),
          },
        }
      : {}),

    sameAs: [SITE.social.instagram, SITE.social.facebook, SITE.social.maps],
  }
}

/** Enables the sitelinks search box, and names the site for Google. */
export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE.name,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#business` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  }
}

export function productJsonLd(product: Product, categorySlug?: string) {
  // Availability is read from stock, not assumed. It was previously hardcoded
  // to InStock, so a sold-out product still told Google it could be bought —
  // which is the kind of mismatch that gets merchant listings demoted.
  const inStock =
    product.badge !== 'SOLD OUT' && (typeof product.stock !== 'number' || product.stock > 0)

  // Offers need a validity date; a year out is the usual convention.
  const validUntil = new Date()
  validUntil.setFullYear(validUntil.getFullYear() + 1)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE_URL}/product/${product.id}#product`,
    name: `${product.brand} ${product.title}`,
    sku: product.id,
    image: product.image ? [product.image] : undefined,
    brand: { '@type': 'Brand', name: product.brand },
    category: categorySlug ? categorySlug.replace(/-/g, ' ') : undefined,
    // Sizes are a real, verifiable attribute of the product.
    ...(product.sizes?.length
      ? {
          size: product.sizes.map(String),
          additionalProperty: {
            '@type': 'PropertyValue',
            name: 'Size system',
            value: 'UK',
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: validUntil.toISOString().slice(0, 10),
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@id': `${SITE_URL}/#business` },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          // Free above the threshold; the fee below it is the real charge.
          value: product.price >= SITE.freeShippingOver ? 0 : 99,
          currency: 'INR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
        },
      },
    },
  }
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/** Category and search listings — helps Google understand the set of items. */
export function itemListJsonLd(products: Product[], listName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 30).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/product/${p.id}`,
      name: `${p.brand} ${p.title}`,
    })),
  }
}
