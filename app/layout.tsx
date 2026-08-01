import type { Metadata, Viewport } from 'next'
import { Outfit, Inter } from 'next/font/google'
import './globals.css'
import { SITE, ADDRESS_ONE_LINE } from '@/data/site'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ConfirmProvider } from '@/components/ConfirmDialog'

// Self-hosted at build time by next/font — no render-blocking request to
// Google, and no layout shift from a late-arriving webfont.
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diamondstepss.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description:
    'Authentic sneakers, sports shoes, loafers and accessories at honest prices. Free shipping over ₹999, COD available, 7-day easy returns. Shipping across India from Jalandhar.',
  keywords: ['sneakers', 'shoes online India', 'Nike', 'Adidas', 'Jordan', 'Jalandhar', 'footwear'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: 'Authentic footwear at honest prices. Free shipping over ₹999. COD available.',
    images: ['/brand/wide-logo.png'],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/brand/favicon.ico', apple: '/brand/app-icon-512.jpg' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
  ],
  width: 'device-width',
  initialScale: 1,
}

/**
 * Runs before first paint so a returning visitor never sees a flash of the
 * wrong theme. Kept as a raw string because it must execute before React.
 */
const THEME_BOOTSTRAP = `
(function(){try{
  var s=localStorage.getItem('ds-theme');
  var t=s||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
  document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()
`

/** Helps Google show the Jalandhar shop in local results. */
const LOCAL_BUSINESS_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'ShoeStore',
  name: SITE.name,
  slogan: SITE.tagline,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/wide-logo.png`,
  telephone: SITE.phone,
  email: SITE.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.line1,
    addressLocality: SITE.address.city,
    addressRegion: SITE.address.state,
    postalCode: SITE.address.pincode,
    addressCountry: 'IN',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '10:00',
    closes: '19:00',
  },
  sameAs: [SITE.social.instagram, SITE.social.facebook, SITE.social.maps],
  description: ADDRESS_ONE_LINE,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSONLD) }}
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
