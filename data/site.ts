// Single source of truth for brand facts.
// Everything here was taken from the live diamondstepss.com and is mirrored in
// PLAN.md §0. Change it here, not in individual components.

export const SITE = {
  name: 'Diamond Stepss',
  tagline: 'Style & Comfort for Every Step!',
  legalName: 'Diamond Stepss',

  phone: '+91 78885 22353',
  phoneHref: 'tel:+917888522353',
  email: 'support@diamondstepss.com',
  emailAlt: 'info@diamondstepss.com',

  /**
   * Transcribed from the Google Business Profile, which is the authority for
   * NAP consistency — Google matches the site against its own listing, so any
   * difference weakens both. The signboard outside reads "Shop No. 8"; the
   * listing says Shop No. 3, and the listing wins.
   *
   * Corrected here: the pincode was 144007, the listing says 144005.
   */
  address: {
    line1: 'Shop No. 3, Ladhewali Rd, near Suman Day School',
    line2: 'Gulmarg Avenue',
    city: 'Jalandhar',
    state: 'Punjab',
    pincode: '144005',
    country: 'India',
  },

  /**
   * Shop coordinates, from the place's own position in the Google Maps URL —
   * the `!3d<lat>!4d<lng>` pair, not the `@lat,lng` prefix, which is only the
   * map viewport centre and sits ~245 m away.
   *
   * Local structured data without geo makes Google infer the location from the
   * address string, which is far less reliable for map-pack matching.
   */
  geo: { lat: 31.3251374, lng: 75.6217813 },

  hours: 'Monday–Saturday, 10 AM – 7 PM IST',
  /** Machine-readable opening hours, mirroring `hours` above. */
  openDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as string[],
  opens: '10:00',
  closes: '19:00',

  /** Where the shop actually delivers — used for areaServed. */
  servesCity: 'Jalandhar',
  servesRegion: 'Punjab',
  servesCountry: 'India',

  social: {
    instagram: 'https://www.instagram.com/diamond_stepss/',
    facebook: 'https://www.facebook.com/profile.php?id=61572978448795',
    whatsapp: 'https://wa.me/917888522353',
    maps: 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7',
  },

  // Commercial rules referenced across policy pages and checkout copy.
  freeShippingOver: 1999,
  codFee: 49,
  partialCodAdvance: 300,
  /** Percent (0-100) when prepaidDiscountType is PERCENT, rupees when FLAT. */
  prepaidDiscountPct: 30,
  prepaidDiscountType: 'FLAT' as const,
  /** Prepaid discount only applies at or above this order value. */
  prepaidDiscountMinOrder: 1499,
  returnWindowDays: 7,
  deliveryDays: '2–5 business days',

  /**
   * Deliberately null: the business is below the GST registration threshold and
   * is not registered, so it cannot charge or collect GST. Nothing on the site
   * may state or imply that prices include GST, and invoices must not show a
   * GSTIN or a tax line.
   */
  gstin: null as string | null,
} as const

export const ADDRESS_ONE_LINE = `${SITE.address.line1}, ${SITE.address.line2}, ${SITE.address.city} ${SITE.address.pincode}, ${SITE.address.state}, ${SITE.address.country}`

export const POLICY_PAGES = [
  { slug: '/shipping-policy', label: 'Shipping Policy' },
  { slug: '/return-policy', label: 'Returns & Exchanges' },
  { slug: '/terms-and-conditions', label: 'Terms of Service' },
  { slug: '/privacy-policy-2', label: 'Privacy Policy' },
  { slug: '/data-deletion', label: 'Data Deletion' },
] as const
