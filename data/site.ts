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

  address: {
    line1: 'Shop No 3, Main Road, Ladhewali Road',
    city: 'Jalandhar',
    state: 'Punjab',
    pincode: '144007',
    country: 'India',
  },
  hours: 'Monday–Saturday, 10 AM – 7 PM IST',

  social: {
    instagram: 'https://www.instagram.com/diamond_stepss/',
    facebook: 'https://www.facebook.com/profile.php?id=61572978448795',
    whatsapp: 'https://wa.me/917888522353',
    maps: 'https://maps.app.goo.gl/5ZbHCdtKLU937L2o7',
  },

  // Commercial rules referenced across policy pages and checkout copy.
  freeShippingOver: 999,
  codFee: 49,
  partialCodAdvance: 300,
  prepaidDiscountPct: 5,
  returnWindowDays: 7,
  deliveryDays: '2–5 business days',

  gstin: null as string | null, // not yet supplied — invoice template uses a placeholder
} as const

export const ADDRESS_ONE_LINE = `${SITE.address.line1}, ${SITE.address.city} ${SITE.address.pincode}, ${SITE.address.state}, ${SITE.address.country}`

export const POLICY_PAGES = [
  { slug: '/shipping-policy', label: 'Shipping Policy' },
  { slug: '/return-policy', label: 'Returns & Exchanges' },
  { slug: '/terms-and-conditions', label: 'Terms of Service' },
  { slug: '/privacy-policy-2', label: 'Privacy Policy' },
] as const
