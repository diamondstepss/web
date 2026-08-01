'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingBag, Trash2, Loader2 } from 'lucide-react'
import PageHero from '@/components/PageHero'
import ProductCard from '@/components/ProductCard'
import SupabaseSetupNotice from '@/components/SupabaseSetupNotice'
import type { Product } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { fetchWishlist, removeFromWishlist, clearWishlist } from '@/lib/api'
import { useConfirm } from '@/components/ConfirmDialog'

export function WishlistPage({ products = [] }: { products?: Product[] }) {
  const PRODUCTS = products
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [ids, setIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const confirm = useConfirm()

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setIds(await fetchWishlist(user.id))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user && isSupabaseConfigured) {
      router.replace('/login?next=/wishlist')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) void load()
  }, [user, load])

  if (!isSupabaseConfigured) {
    return (
      <div style={{ background: 'var(--bg)' }}>
        <PageHero eyebrow="Saved for later" title="Wishlist" crumbs={[{ label: 'Wishlist' }]} compact />
        <div className="mx-auto max-w-2xl px-6 py-14">
          <SupabaseSetupNotice />
        </div>
      </div>
    )
  }

  const items = PRODUCTS.filter((p) => ids.includes(p.id))

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero
        eyebrow="Saved for later"
        title="Wishlist"
        lede={
          items.length
            ? `${items.length} item${items.length === 1 ? '' : 's'} waiting. Sizes sell out fast — don't wait too long.`
            : undefined
        }
        crumbs={[{ label: 'Wishlist' }]}
        compact
      />

      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          {authLoading || loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          ) : items.length > 0 ? (
            <>
              <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{items.length}</strong> saved
                </p>
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Clear your wishlist?',
                      message: `All ${items.length} saved items will be removed.`,
                      confirmLabel: 'Clear all',
                    })
                    if (!ok) return
                    if (user) await clearWishlist(user.id)
                    void load()
                  }}
                  className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
                >
                  <Trash2 size={13} /> Clear all
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((p) => (
                  <div key={p.id} className="relative">
                    <ProductCard product={p} />
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Remove from wishlist?',
                          message: `"${p.title}" will no longer be saved.`,
                          confirmLabel: 'Remove',
                        })
                        if (!ok) return
                        if (user) await removeFromWishlist(user.id, p.id)
                        void load()
                      }}
                      aria-label={`Remove ${p.title} from wishlist`}
                      className="absolute top-2 right-2 z-10 flex items-center justify-center"
                      style={{ width: 32, height: 32, background: 'rgba(0,0,0,0.65)', color: '#fff' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div
                className="mt-12 p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)' }}
              >
                <div>
                  <p
                    className="text-lg font-black uppercase"
                    style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
                  >
                    Ready to order?
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Free shipping on orders over ₹999, and 7-day easy returns on everything.
                  </p>
                </div>
                <Link
                  href="/cart"
                  className="flex items-center gap-2 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white shrink-0"
                  style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
                >
                  <ShoppingBag size={16} />
                  Go to cart
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Heart size={52} style={{ color: 'var(--text-muted)', margin: '0 auto 22px', opacity: 0.4 }} />
              <h2
                className="text-2xl md:text-3xl font-black uppercase mb-3"
                style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                Nothing saved yet
              </h2>
              <p className="text-sm mb-8 max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Tap the heart on any product to keep it here. We'll tell you if it goes on sale.
              </p>
              <Link
                href="/shop"
                className="inline-block px-9 py-3.5 text-sm font-black uppercase tracking-widest text-white"
                style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
              >
                Start shopping
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}


export default WishlistPage
