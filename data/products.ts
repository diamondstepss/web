import type { Product } from '@/lib/types'

/**
 * Placeholder catalog.
 *
 * Every image below was downloaded and visually checked, so the brand shown in
 * the photograph matches the brand on the product and the silhouette matches
 * the product type. No image is reused across two products.
 *
 * These are still stock photographs — they cannot depict Diamond Stepss'
 * actual stock. Replace with the shop's own photography before launch; that is
 * also what unblocks moving the catalog into Postgres (PLAN.md §5).
 */
export const PRODUCTS: Product[] = [
  {
    id: '1',
    brand: 'Nike',
    title: 'Free RN Flyknit Crimson',
    price: 2499,
    mrp: 3499,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop&auto=format',
    isNew: true,
  },
  {
    id: '2',
    brand: 'Puma',
    title: 'Smash Leather White',
    price: 1499,
    mrp: 2799,
    discount: 46,
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop&auto=format',
  },
  {
    id: '3',
    brand: 'Nike',
    title: 'SuperRep Go Training Volt',
    price: 2899,
    mrp: 3499,
    discount: 17,
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop&auto=format',
    isNew: true,
  },
  {
    id: '4',
    brand: 'Converse',
    title: 'Chuck Taylor All Star Hi Green',
    price: 1299,
    mrp: 2199,
    discount: 41,
    image: 'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=600&h=600&fit=crop&auto=format',
  },
  {
    id: '5',
    brand: 'Nike',
    title: 'Air Max 90 White Pink',
    price: 3199,
    mrp: 3499,
    discount: 9,
    image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&h=600&fit=crop&auto=format',
  },
  {
    id: '6',
    brand: 'New Balance',
    title: '574 Core Olive',
    price: 2799,
    mrp: 3499,
    discount: 20,
    image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&h=600&fit=crop&auto=format',
  },
  {
    id: '7',
    brand: 'Nike',
    title: 'Air Max 1 Sunset',
    price: 2999,
    mrp: 3499,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=600&fit=crop&auto=format',
  },
  {
    id: '8',
    brand: 'Nike',
    title: 'Air Force 1 Shadow Pastel',
    price: 3299,
    mrp: 3500,
    discount: 6,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop&auto=format',
    isNew: true,
  },
  {
    id: '9',
    brand: 'Nike',
    title: 'Air Max Zero Ultramarine',
    price: 2199,
    mrp: 3299,
    discount: 33,
    image: 'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=600&h=600&fit=crop&auto=format',
  },
  {
    id: '10',
    brand: 'Nike',
    title: 'Precision Mid Basketball Grey',
    price: 2699,
    mrp: 3499,
    discount: 23,
    image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=600&fit=crop&auto=format',
  },
  {
    id: '11',
    brand: 'Nike',
    title: "Air Force 1 '07 Wheat",
    price: 3299,
    mrp: 3500,
    discount: 6,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop&auto=format',
  },
  {
    id: '12',
    brand: 'Nike',
    title: 'Air Max Colour Block Pack',
    price: 3099,
    mrp: 3499,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&h=600&fit=crop&auto=format',
    badge: 'SOLD OUT',
  },

  // ── Accessories ──────────────────────────────────────────────────────────
  {
    id: '13',
    brand: 'Diamond Stepss',
    title: 'Chronograph Watch Black Leather',
    price: 1899,
    mrp: 3199,
    discount: 41,
    image: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&h=600&fit=crop&auto=format',
  },
  {
    id: '14',
    brand: 'Diamond Stepss',
    title: 'Steel Dress Watch Silver',
    price: 2299,
    mrp: 3499,
    discount: 34,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=600&fit=crop&auto=format',
    isNew: true,
  },
]

/** Deepest-discount subset, used by the homepage sale rail. */
export const SALE_PRODUCTS: Product[] = PRODUCTS.filter((p) => p.discount >= 29)
