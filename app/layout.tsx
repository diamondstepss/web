import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Outfit, Inter } from 'next/font/google'
import './globals.css'
import { SITE } from '@/data/site'
import { getStoreSettings } from '@/lib/settings'
import { localBusinessJsonLd, webSiteJsonLd, jsonLdScript } from '@/lib/jsonld'
import { getCategories } from '@/lib/catalog'
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

export async function generateMetadata(): Promise<Metadata> {
  const { freeShippingOver } = await getStoreSettings()
  const free = `₹${freeShippingOver.toLocaleString('en-IN')}`
  return {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description:
    `Authentic sneakers, sports shoes, loafers and accessories at honest prices. Free shipping over ${free}, COD available, 7-day easy returns. Shipping across India from Jalandhar.`,
  keywords: ['sneakers', 'shoes online India', 'Nike', 'Adidas', 'Jordan', 'Jalandhar', 'footwear'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: `Authentic footwear at honest prices. Free shipping over ${free}. COD available.`,
    images: ['/brand/wide-logo.png'],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/brand/favicon.ico', apple: '/brand/app-icon-512.jpg' },
  robots: { index: true, follow: true },
  }
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Cached with the rest of the catalog, so this costs nothing per request.
  const categories = await getCategories()
  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${inter.variable}`}>
      <body>
        {/*
          next/script rather than a bare <script>: React 19 warns that scripts
          rendered inside a component never execute on the client, and a raw tag
          in <head> tripped that on every render. `beforeInteractive` inlines
          this ahead of any Next.js code, so the attribute is still set before
          first paint and a returning visitor sees no flash of the wrong theme.
        */}
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP}
        </Script>

        {/*
          JSON-LD is data, not code — browsers never execute an ld+json block.
          Escaping `<` stops a value containing "</script>" from closing the tag
          early, which is the pattern Next's own JSON-LD guide prescribes.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(localBusinessJsonLd(categories)) }}
        />
        {/* Sitelinks search box. Points at the real /search route. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(webSiteJsonLd()) }}
        />

        <AuthProvider>
          <CartProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
