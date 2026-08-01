'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Package, Truck, Loader2, Wallet } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { fetchOrders } from '@/lib/api'
import { SITE } from '@/data/site'
import type { Order } from '@/lib/types'

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`

export function OrderSuccessPage() {
  const params = useSearchParams()
  const number = params.get('order')
  const { user, loading: authLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchOrders(user.id)
      .then((all) => setOrder(all.find((o) => o.order_number === number) ?? all[0] ?? null))
      .finally(() => setLoading(false))
  }, [user, number])

  const eta = new Date()
  eta.setDate(eta.getDate() + 4)

  return (
    <div className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: 520,
          background:
            'radial-gradient(55% 60% at 50% 0%, color-mix(in srgb, var(--success) 16%, transparent) 0%, transparent 70%)',
        }}
      />

      <section className="relative mx-auto max-w-[720px] px-6 py-20 text-center">
        <div
          className="inline-flex items-center justify-center mb-7 fade-up"
          style={{
            width: 76,
            height: 76,
            borderRadius: 99,
            background: 'color-mix(in srgb, var(--success) 16%, transparent)',
          }}
        >
          <CheckCircle2 size={38} style={{ color: 'var(--success)' }} />
        </div>

        <h1
          className="font-black uppercase leading-[0.9] fade-up"
          style={{
            fontFamily: 'var(--font-outfit)',
            fontSize: 'clamp(34px, 6vw, 54px)',
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            animationDelay: '.06s',
          }}
        >
          Order confirmed
        </h1>

        <p className="mt-4 text-sm fade-up" style={{ color: 'var(--text-muted)', animationDelay: '.12s' }}>
          Thanks — we&apos;re packing it now. Your order number is{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{number ?? '—'}</strong>
        </p>

        {(authLoading || loading) && (
          <Loader2 size={20} className="animate-spin mx-auto mt-10" style={{ color: 'var(--accent)' }} />
        )}

        {order && (
          <div
            className="mt-10 text-left overflow-hidden fade-up"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, animationDelay: '.18s' }}
          >
            <div className="p-6 space-y-4">
              {order.order_items?.map((it) => (
                <div key={it.id} className="flex gap-4">
                  <div className="shrink-0 overflow-hidden" style={{ width: 68, height: 68, borderRadius: 10, background: 'var(--hover)' }}>
                    {it.image && <img src={it.image} alt={it.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}>
                      {it.brand}
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{it.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {it.size ? `Size UK ${it.size}` : ''}{it.qty > 1 ? ` · Qty ${it.qty}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-black" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)' }}>
                    {inr(it.price)}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Total</span>
              <span className="text-lg font-black" style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)' }}>
                {inr(order.total)}
              </span>
            </div>

            {Number(order.amount_due_on_delivery) > 0 && (
              <p className="mx-6 mb-6 flex items-center gap-2 text-xs font-bold px-4 py-3" style={{ background: 'color-mix(in srgb, var(--warning) 14%, transparent)', color: 'var(--warning)', borderRadius: 10 }}>
                <Wallet size={14} />
                Keep {inr(order.amount_due_on_delivery)} ready for the courier
              </p>
            )}

            <div className="px-6 py-5 flex items-center gap-6 flex-wrap" style={{ borderTop: '1px solid var(--border)', background: 'var(--hover)' }}>
              <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Package size={14} style={{ color: 'var(--accent)' }} /> Packing today
              </span>
              <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Truck size={14} style={{ color: 'var(--accent)' }} />
                Arriving by {eta.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 flex-wrap justify-center mt-9 fade-up" style={{ animationDelay: '.24s' }}>
          <Link
            href="/my-account"
            className="px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-white"
            style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
          >
            Track your order
          </Link>
          <Link
            href="/shop"
            className="px-8 py-3.5 text-[11px] font-black uppercase tracking-widest"
            style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
          >
            Keep shopping
          </Link>
        </div>

        <p className="mt-8 text-xs" style={{ color: 'var(--text-muted)' }}>
          Questions? WhatsApp us on {SITE.phone}
        </p>
      </section>
    </div>
  )
}

export default OrderSuccessPage
