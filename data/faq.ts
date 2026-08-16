import { SITE } from '@/data/site'
import { DEFAULT_SETTINGS, type StoreSettings } from '@/lib/settings'

/**
 * FAQ content.
 *
 * Lives here rather than inside FAQPage because that component is `'use
 * client'` — importing a plain array out of a client module gives the server a
 * client-reference proxy, not the data, which made /faq throw
 * "GROUPS.flatMap is not a function" at request time.
 *
 * The route builds FAQPage structured data from this, and the component renders
 * from the same source, so the markup can never describe questions the page
 * doesn't show.
 *
 * Shipping figures come from settings, not from constants. They are editable in
 * the admin, and an FAQ that answers "how much is shipping?" with a stale number
 * is a customer service problem rather than a typo.
 */
export interface FaqItem { q: string; a: string }
export interface FaqGroup { id: string; group: string; items: FaqItem[] }

export function faqGroups(s: StoreSettings = DEFAULT_SETTINGS): FaqGroup[] {
  return [
  {
    id: 'payment',
    group: 'Orders & Payment',
    items: [
      {
        q: 'Which payment methods do you accept?',
        a: 'UPI (GPay, PhonePe, Paytm), credit and debit cards, net banking, and wallets — all processed securely by Instamojo. Cash on Delivery is available too.',
      },
      {
        q: 'What is Partial COD?',
        a: `Partial COD lets you pay a small advance of ₹${SITE.partialCodAdvance} online and the balance in cash on delivery. The advance covers shipping and is non-refundable if you refuse the parcel at the door.`,
      },
      {
        q: 'Is there a discount for paying online?',
        a: `Yes — prepaid orders over ₹${SITE.prepaidDiscountMinOrder} get an extra ${SITE.prepaidDiscountPct}% off, and you always skip the ₹${SITE.codFee} COD handling fee. It is the cheapest way to order.`,
      },
      {
        q: 'Can I cancel after ordering?',
        a: 'Yes, any time before dispatch, from your account or by WhatsApp. Once the parcel is handed to the courier it has to go through the returns process instead.',
      },
    ],
  },
  {
    id: 'shipping',
    group: 'Shipping & Delivery',
    items: [
      {
        q: 'How long will delivery take?',
        a: `Typically ${SITE.deliveryDays} from dispatch. We ship from Jalandhar and cover every serviceable pincode in India. Enter your pincode on any product page for an exact estimate.`,
      },
      {
        q: 'How much is shipping?',
        a: `Free on orders over ₹${s.freeShippingOver.toLocaleString('en-IN')}. Below that, a flat ₹${s.shippingFee} applies and is always shown in the cart before you pay.`,
      },
      {
        q: 'How do I track my order?',
        a: 'You get an SMS and WhatsApp with a tracking link as soon as the courier collects your parcel. You can also track it from your account, or from the Track Order page using your order number and phone.',
      },
    ],
  },
  {
    id: 'sizing',
    group: 'Sizing & Returns',
    items: [
      {
        q: 'Which size should I order?',
        a: 'We list everything in UK sizes 6 to 11. The Size Guide has a UK/EU/US/cm conversion table and instructions for measuring your foot at home. If you are between sizes, size up.',
      },
      {
        q: 'How do I return or exchange something?',
        a: `Raise a request from your account within ${SITE.returnWindowDays} days of delivery. We arrange a free pickup, run a quick quality check, and then ship your exchange or issue a refund in 5–7 working days.`,
      },
      {
        q: 'What condition must a return be in?',
        a: 'Unworn and unwashed, with all tags attached and in the original box. Try shoes on indoors, on a clean surface — visible sole wear means we cannot accept the return.',
      },
    ],
  },
  {
    id: 'authenticity',
    group: 'Authenticity',
    items: [
      {
        q: 'Are your products 100% genuine?',
        a: 'Yes. We source through authorised channels only. Every product arrives in original packaging with tags intact.',
      },
      {
        q: 'Do you have a physical store?',
        a: `Yes — ${SITE.address.line1}, ${SITE.address.city}. Open ${SITE.hours}. You're welcome to try before you buy.`,
      },
    ],
  },
  ]
}

/** Flattened, for structured data. */
export const faqItems = (s: StoreSettings = DEFAULT_SETTINGS): FaqItem[] =>
  faqGroups(s).flatMap((g) => g.items)
