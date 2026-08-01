'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Product } from '@/lib/types'

export interface CartLine {
  productId: string // the product slug
  brand: string
  title: string
  image: string
  price: number
  mrp: number
  size: string | null
  qty: number
}

interface CartValue {
  lines: CartLine[]
  /**
   * False until localStorage has been read. The cart is empty on the server, so
   * anything that renders differently when the cart has items — the header
   * badge especially — must wait for this or React reports a hydration
   * mismatch and throws the tree away.
   */
  hydrated: boolean
  count: number
  subtotal: number
  savings: number
  add: (product: Product, size?: string | null, qty?: number) => void
  remove: (productId: string, size: string | null) => void
  setQty: (productId: string, size: string | null, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartValue | undefined>(undefined)
const KEY = 'ds-cart'

/** Same product in two sizes is two lines, so identity includes the size. */
const sameLine = (l: CartLine, id: string, size: string | null) =>
  l.productId === id && (l.size ?? null) === (size ?? null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load once on mount — reading localStorage during render would break SSR.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setLines(JSON.parse(raw) as CartLine[])
    } catch {
      /* corrupt payload — start empty rather than crash the app */
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {
      /* quota or private mode */
    }
  }, [lines, hydrated])

  const add: CartValue['add'] = useCallback((product, size = null, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => sameLine(l, product.id, size))
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], qty: next[i].qty + qty }
        return next
      }
      return [
        ...prev,
        {
          productId: product.id,
          brand: product.brand,
          title: product.title,
          image: product.image,
          price: product.price,
          mrp: product.mrp,
          size: size ?? null,
          qty,
        },
      ]
    })
  }, [])

  const remove: CartValue['remove'] = useCallback((id, size) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, id, size)))
  }, [])

  const setQty: CartValue['setQty'] = useCallback((id, size, qty) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => !sameLine(l, id, size))
        : prev.map((l) => (sameLine(l, id, size) ? { ...l, qty } : l)),
    )
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const count = lines.reduce((s, l) => s + l.qty, 0)
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const savings = lines.reduce((s, l) => s + Math.max(l.mrp - l.price, 0) * l.qty, 0)

  return (
    <CartContext.Provider value={{ lines, hydrated, count, subtotal, savings, add, remove, setQty, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
