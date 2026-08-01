import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next 16 blocks dev requests from origins it doesn't recognise. Without
  // this, opening the dev server on 127.0.0.1 (rather than localhost) blocks
  // the HMR socket and the page never hydrates — it renders but nothing clicks.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],

  // Default is bottom-left, which lands squarely on the admin sidebar's
  // account block and hides the sign-out button while developing.
  devIndicators: { position: 'bottom-right' },

  images: {
    // Catalog art is on Unsplash while product images live outside the DB.
    // Replace with your own bucket host when the catalog moves to Supabase.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cqqyikhvbvwvpbqmwxvl.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  async redirects() {
    return [
      // ── Cleaning up the broken WooCommerce category tree (PLAN.md §0) ──
      // `sneakers` was orphaned under /uncategorized/ and `sports-shoes` was
      // nested under running-shoes. Both are indexed, so they get 301s.
      {
        source: '/product-category/uncategorized/sneakers',
        destination: '/product-category/sneakers',
        permanent: true,
      },
      {
        source: '/product-category/running-shoes/sports-shoes',
        destination: '/product-category/sports-shoes',
        permanent: true,
      },

      // ── Legacy WooCommerce paths that changed name ──
      { source: '/compare', destination: '/shop', permanent: true },
      { source: '/best-selling-products', destination: '/shop', permanent: true },
      { source: '/featured', destination: '/shop', permanent: true },
      { source: '/privacy-policy', destination: '/privacy-policy-2', permanent: true },

      // ── Prototype paths, in case anything still links to them ──
      { source: '/account', destination: '/my-account', permanent: true },
      { source: '/track', destination: '/order-tracking', permanent: true },
      { source: '/about', destination: '/about-us', permanent: true },
      { source: '/policies/shipping', destination: '/shipping-policy', permanent: true },
      { source: '/policies/returns', destination: '/return-policy', permanent: true },
      { source: '/policies/terms', destination: '/terms-and-conditions', permanent: true },
      { source: '/policies/privacy', destination: '/privacy-policy-2', permanent: true },
      { source: '/category/:slug*', destination: '/product-category/:slug*', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
