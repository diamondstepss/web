'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Package,
  MapPin,
  Heart,
  User,
  LogOut,
  Truck,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Star,
  ArrowRight,
  Wallet,
  Clock,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import SupabaseSetupNotice from '@/components/SupabaseSetupNotice'
import { WhatsAppIcon } from '@/components/SocialIcons'
import { useConfirm } from '@/components/ConfirmDialog'
import type { Product } from '@/lib/types'
import { SITE } from '@/data/site'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  fetchOrders,
  fetchAddresses,
  fetchWishlist,
  updateProfile,
  cancelOrder,
  deleteAddress,
  setDefaultAddress,
  createAddress,
  removeFromWishlist,
  type AddressInput,
} from '@/lib/api'
import {
  type Order,
  type Address,
  ORDER_STEPS,
  STEP_LABELS,
  PAYMENT_LABELS,
  orderProgress,
} from '@/lib/types'

type Tab = 'orders' | 'addresses' | 'wishlist' | 'profile'

const STATUS_META: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  CONFIRMED: { label: 'Confirmed', color: '#8b8b8b', icon: Package },
  PACKED: { label: 'Packed', color: '#8b8b8b', icon: Package },
  SHIPPED: { label: 'Shipped', color: '#3b82f6', icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', color: 'var(--warning)', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'var(--success)', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'var(--danger)', icon: XCircle },
}

const inr = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** One shell width for the whole site, so header, content and footer align. */
const SHELL = 'mx-auto w-full max-w-[1440px] px-6'

export function AccountPage({ products = [] }: { products?: Product[] }) {
  const PRODUCTS = products
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth()
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const confirm = useConfirm()

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [o, a, w] = await Promise.all([
        fetchOrders(user.id),
        fetchAddresses(user.id),
        fetchWishlist(user.id),
      ])
      setOrders(o)
      setAddresses(a)
      setWishlist(w)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your account.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user && isSupabaseConfigured) router.replace('/login?next=/my-account')
  }, [authLoading, user, router])

  useEffect(() => {
    if (user) void load()
  }, [user, load])

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 py-20" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-xl">
          <SupabaseSetupNotice />
        </div>
      </div>
    )
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center" style={{ background: 'var(--bg)', minHeight: '70vh' }}>
        <Loader2 size={26} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  const name = profile?.full_name?.trim() || user.email?.split('@')[0] || 'there'
  const first = name.split(' ')[0]
  const inTransit = orders.filter((o) => ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status)).length
  const dueOnDelivery = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((s, o) => s + Number(o.amount_due_on_delivery ?? 0), 0)
  const lifetime = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((s, o) => s + Number(o.total ?? 0), 0)

  const TABS: { key: Tab; label: string; icon: typeof Package; count?: number }[] = [
    { key: 'orders', label: 'Orders', icon: Package, count: orders.length },
    { key: 'addresses', label: 'Addresses', icon: MapPin, count: addresses.length },
    { key: 'wishlist', label: 'Wishlist', icon: Heart, count: wishlist.length },
    { key: 'profile', label: 'Profile', icon: User },
  ]

  const activeOrder = orders.find((o) => ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status))

  return (
    <div className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: 560,
          background:
            'radial-gradient(50% 60% at 12% 0%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 70%)',
        }}
      />

      {/* ── Masthead: greeting + metrics on one line ─────────────────── */}
      <header className={`relative ${SHELL} pt-12 pb-8`}>
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-8">
          <div className="fade-up">
            <div className="flex items-center gap-3 mb-4">
              <span aria-hidden className="shimmer-line" style={{ height: 2, width: 30 }} />
              <span
                className="text-[11px] font-black uppercase tracking-[0.2em]"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-outfit)' }}
              >
                {profile ? `Member since ${fmtDate(profile.created_at)}` : 'Your account'}
              </span>
            </div>
            <h1
              className="font-black uppercase leading-[0.88]"
              style={{
                fontFamily: 'var(--font-outfit)',
                fontSize: 'clamp(38px, 5vw, 64px)',
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
              }}
            >
              Hello, {first}
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 fade-up" style={{ animationDelay: '.08s' }}>
            {[
              { label: 'Orders', value: String(orders.length), icon: Package },
              { label: 'In transit', value: String(inTransit), icon: Truck },
              { label: 'Due on delivery', value: inr(dueOnDelivery), icon: Wallet, accent: dueOnDelivery > 0 },
              { label: 'Lifetime spend', value: inr(lifetime), icon: Star },
            ].map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className="px-5 py-4 min-w-[150px]"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                }}
              >
                <Icon size={15} style={{ color: accent ? 'var(--warning)' : 'var(--text-muted)' }} />
                <p
                  className="mt-2.5 text-xl font-black"
                  style={{
                    fontFamily: 'var(--font-outfit)',
                    letterSpacing: '-0.02em',
                    color: accent ? 'var(--warning)' : 'var(--text-primary)',
                  }}
                >
                  {value}
                </p>
                <p
                  className="mt-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Horizontal tab bar (no sidebar list) ─────────────────────── */}
      <div
        className="relative sticky z-30"
        style={{ top: 61, background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className={`${SHELL} flex items-center justify-between gap-6`}>
          <nav className="flex gap-1 overflow-x-auto no-scrollbar -mb-px">
            {TABS.map(({ key, label, icon: Icon, count }) => {
              const on = tab === key
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex items-center gap-2 px-4 py-4 text-xs font-black uppercase tracking-widest whitespace-nowrap"
                  style={{
                    color: on ? 'var(--accent)' : 'var(--text-muted)',
                    borderBottom: `2px solid ${on ? 'var(--accent)' : 'transparent'}`,
                    fontFamily: 'var(--font-outfit)',
                    transition: 'color .2s ease, border-color .2s ease',
                  }}
                >
                  <Icon size={15} />
                  {label}
                  {count !== undefined && count > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5"
                      style={{
                        borderRadius: 99,
                        background: on ? 'var(--accent)' : 'var(--hover)',
                        color: on ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <button
            onClick={async () => {
              await signOut()
              router.replace('/')
            }}
            className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-widest shrink-0"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <main className={`relative ${SHELL} py-10 pb-24`}>
        {error && (
          <p
            className="text-xs px-4 py-3 mb-6"
            style={{
              background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
              color: 'var(--danger)',
              borderRadius: 10,
            }}
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-28">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : (
          <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-8">
            {/* ── Main column ──────────────────────────────────────── */}
            <div className="min-w-0">
              {tab === 'orders' &&
                (orders.length === 0 ? (
                  <Empty
                    icon={Package}
                    title="No orders yet"
                    body="When you place an order it appears here with live tracking."
                    cta={{ href: '/shop', label: 'Start shopping' }}
                  />
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        open={expanded === o.id}
                        onToggle={() => setExpanded(expanded === o.id ? null : o.id)}
                        onCancel={async () => {
                          const ok = await confirm({
                            title: 'Cancel this order?',
                            message: `Order ${o.order_number} will be cancelled. This cannot be undone — you'd need to place a new order.`,
                            confirmLabel: 'Cancel order',
                            cancelLabel: 'Keep order',
                          })
                          if (!ok) return
                          await cancelOrder(o.id)
                          void load()
                        }}
                      />
                    ))}
                  </div>
                ))}

              {tab === 'addresses' && (
                <AddressesTab addresses={addresses} userId={user.id} defaultName={name} onChanged={load} />
              )}

              {tab === 'wishlist' &&
                (wishlist.length === 0 ? (
                  <Empty
                    icon={Heart}
                    title="Your wishlist is empty"
                    body="Tap the heart on any product to save it here."
                    cta={{ href: '/shop', label: 'Browse products' }}
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {PRODUCTS.filter((p) => wishlist.includes(p.id)).map((p) => (
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
                            await removeFromWishlist(user.id, p.id)
                            void load()
                          }}
                          aria-label={`Remove ${p.title}`}
                          className="absolute top-2 right-2 z-10 flex items-center justify-center"
                          style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(0,0,0,0.65)', color: '#fff' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

              {tab === 'profile' && (
                <ProfileTab
                  email={user.email ?? ''}
                  fullName={profile?.full_name ?? ''}
                  phone={profile?.phone ?? ''}
                  onSave={async (patch) => {
                    await updateProfile(user.id, patch)
                    await refreshProfile()
                  }}
                />
              )}
            </div>

            {/* ── Right rail: fills the space with useful context ──── */}
            <aside className="space-y-4">
              {activeOrder && (
                <Panel title="Arriving soon">
                  <p
                    className="text-sm font-black"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}
                  >
                    #{activeOrder.order_number}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {activeOrder.courier ?? 'In transit'}
                    {activeOrder.awb ? ` · ${activeOrder.awb}` : ''}
                  </p>
                  <Progress step={orderProgress(activeOrder.status)} />
                  {Number(activeOrder.amount_due_on_delivery) > 0 && (
                    <p
                      className="mt-4 text-xs font-bold px-3 py-2"
                      style={{
                        background: 'color-mix(in srgb, var(--warning) 14%, transparent)',
                        color: 'var(--warning)',
                        borderRadius: 8,
                      }}
                    >
                      Keep {inr(activeOrder.amount_due_on_delivery)} ready for the courier
                    </p>
                  )}
                </Panel>
              )}

              <Panel title="Default address">
                {addresses.find((a) => a.is_default) ? (
                  (() => {
                    const a = addresses.find((x) => x.is_default)!
                    return (
                      <>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                          {a.name}
                        </p>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {a.line1}
                          <br />
                          {a.city}, {a.state} {a.pincode}
                        </p>
                        <button
                          onClick={() => setTab('addresses')}
                          className="mt-4 flex items-center gap-1 text-[11px] font-black uppercase tracking-widest"
                          style={{ color: 'var(--accent)', fontFamily: 'var(--font-outfit)' }}
                        >
                          Manage <ArrowRight size={12} />
                        </button>
                      </>
                    )
                  })()
                ) : (
                  <button
                    onClick={() => setTab('addresses')}
                    className="text-xs font-bold"
                    style={{ color: 'var(--accent)' }}
                  >
                    + Add a delivery address
                  </button>
                )}
              </Panel>

              <Panel title="Need help?">
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                  We reply on WhatsApp within minutes, {SITE.hours}.
                </p>
                <a
                  href={SITE.social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 text-[11px] font-black uppercase tracking-widest text-white"
                  style={{ background: '#25d366', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
                >
                  <WhatsAppIcon size={14} /> Chat with us
                </a>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Link
                    href="/return-policy"
                    className="text-center py-2.5 text-[10px] font-black uppercase tracking-widest"
                    style={{ border: '1px solid var(--border)', borderRadius: 99, color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
                  >
                    Returns
                  </Link>
                  <Link
                    href="/size-guide"
                    className="text-center py-2.5 text-[10px] font-black uppercase tracking-widest"
                    style={{ border: '1px solid var(--border)', borderRadius: 99, color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
                  >
                    Size guide
                  </Link>
                </div>
              </Panel>

              <button
                onClick={async () => {
                  await signOut()
                  router.replace('/')
                }}
                className="sm:hidden flex items-center justify-center gap-2 w-full py-3.5 text-xs font-black uppercase tracking-widest"
                style={{ border: '1px solid var(--border)', borderRadius: 99, color: 'var(--accent)', fontFamily: 'var(--font-outfit)' }}
              >
                <LogOut size={14} /> Logout
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

/* ── Order card ──────────────────────────────────────────────────────── */

function OrderCard({
  order: o,
  open,
  onToggle,
  onCancel,
}: {
  order: Order
  open: boolean
  onToggle: () => void
  onCancel: () => void
}) {
  const meta = STATUS_META[o.status] ?? STATUS_META.CONFIRMED
  const StatusIcon = meta.icon
  const step = orderProgress(o.status)
  const due = Number(o.amount_due_on_delivery ?? 0)

  return (
    <article
      className="overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span
          className="text-sm font-black"
          style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          #{o.order_number}
        </span>
        <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Clock size={12} /> {fmtDate(o.placed_at)}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {PAYMENT_LABELS[o.payment_mode] ?? o.payment_mode}
        </span>
        <span
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white"
          style={{ background: meta.color, borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
        >
          <StatusIcon size={11} />
          {meta.label}
        </span>
      </div>

      <div className="p-6">
        <div className="flex flex-wrap gap-5">
          {o.order_items?.map((it) => (
            <div key={it.id} className="flex gap-4 min-w-[260px] flex-1">
              <div
                className="shrink-0 overflow-hidden"
                style={{ width: 92, height: 92, borderRadius: 12, background: 'var(--hover)' }}
              >
                {it.image && <img src={it.image} alt={it.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
                >
                  {it.brand}
                </p>
                <p className="text-sm font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                  {it.title}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {it.size ? `Size ${it.size}` : ''}
                  {it.qty > 1 ? ` · Qty ${it.qty}` : ''}
                </p>
                <p
                  className="text-base font-black mt-2"
                  style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)' }}
                >
                  {inr(it.price)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {due > 0 && o.status !== 'CANCELLED' && (
          <p
            className="mt-5 inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2"
            style={{
              background: 'color-mix(in srgb, var(--warning) 14%, transparent)',
              color: 'var(--warning)',
              borderRadius: 99,
            }}
          >
            <Wallet size={13} />
            {inr(due)} due on delivery
            {Number(o.amount_paid_online) > 0 && ` · ${inr(o.amount_paid_online)} already paid`}
          </p>
        )}

        {open && step > 0 && (
          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            {o.courier && (
              <p
                className="text-[11px] font-black uppercase tracking-widest mb-5"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
              >
                {o.courier}
                {o.awb ? ` · AWB ${o.awb}` : ''}
              </p>
            )}
            <Progress step={step} labels />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-5">
          {step > 0 && (
            <button
              onClick={onToggle}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white"
              style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
            >
              <Truck size={13} />
              {open ? 'Hide tracking' : 'Track order'}
            </button>
          )}
          {o.status === 'DELIVERED' && (
            <Link
              href="/return-policy"
              className="flex items-center gap-1.5 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest"
              style={{ border: '1px solid var(--border)', borderRadius: 99, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}
            >
              <RotateCcw size={13} /> Return
            </Link>
          )}
          {['CONFIRMED', 'PACKED'].includes(o.status) && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 text-[11px] font-black uppercase tracking-widest"
              style={{ border: '1px solid var(--border)', borderRadius: 99, color: 'var(--danger)', fontFamily: 'var(--font-outfit)' }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function Progress({ step, labels = false }: { step: number; labels?: boolean }) {
  return (
    <div className="flex items-start mt-4">
      {ORDER_STEPS.map((s, i) => {
        const done = i < step
        const current = i === step - 1
        return (
          <div key={s} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <span
                aria-hidden
                className="absolute"
                style={{
                  top: 6,
                  right: '50%',
                  width: '100%',
                  height: 2,
                  background: done ? 'var(--accent)' : 'var(--border)',
                }}
              />
            )}
            <span
              className="relative rounded-full"
              style={{
                width: 14,
                height: 14,
                background: done ? 'var(--accent)' : 'var(--border)',
                boxShadow: current ? '0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent)' : 'none',
              }}
            />
            {labels && (
              <span
                className="mt-2 text-[9px] text-center leading-tight px-1"
                style={{ color: done ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                {STEP_LABELS[s]}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Addresses ───────────────────────────────────────────────────────── */

function AddressesTab({
  addresses,
  userId,
  defaultName,
  onChanged,
}: {
  addresses: Address[]
  userId: string
  defaultName: string
  onChanged: () => Promise<void> | void
}) {
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const confirm = useConfirm()
  const [form, setForm] = useState<AddressInput>({
    label: 'HOME',
    name: defaultName,
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    is_default: addresses.length === 0,
  })

  const field = {
    height: 48,
    background: 'color-mix(in srgb, var(--accent) 6%, var(--bg))',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text-primary)',
  } as const
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  return (
    <>
      {adding && (
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            try {
              await createAddress(userId, form)
              setAdding(false)
              setForm({ ...form, line1: '', line2: '', city: '', state: '', pincode: '' })
              await onChanged()
            } finally {
              setBusy(false)
            }
          }}
          className="p-6 mb-4 grid sm:grid-cols-2 gap-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}
        >
          <Labeled label="Type">
            <select value={form.label} onChange={set('label')} className="w-full px-4 text-sm outline-none" style={field}>
              <option>HOME</option>
              <option>WORK</option>
              <option>OTHER</option>
            </select>
          </Labeled>
          <Labeled label="Full name">
            <input required value={form.name} onChange={set('name')} className="w-full px-4 text-sm outline-none" style={field} />
          </Labeled>
          <Labeled label="Phone">
            <input required value={form.phone} onChange={set('phone')} placeholder="+91" className="w-full px-4 text-sm outline-none" style={field} />
          </Labeled>
          <Labeled label="Pincode">
            <input required value={form.pincode} onChange={set('pincode')} className="w-full px-4 text-sm outline-none" style={field} />
          </Labeled>
          <div className="sm:col-span-2">
            <Labeled label="Address">
              <input required value={form.line1} onChange={set('line1')} className="w-full px-4 text-sm outline-none" style={field} />
            </Labeled>
          </div>
          <Labeled label="City">
            <input required value={form.city} onChange={set('city')} className="w-full px-4 text-sm outline-none" style={field} />
          </Labeled>
          <Labeled label="State">
            <input required value={form.state} onChange={set('state')} className="w-full px-4 text-sm outline-none" style={field} />
          </Labeled>
          <div className="sm:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="px-7 py-3 text-[11px] font-black uppercase tracking-widest text-white"
              style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)', opacity: busy ? 0.6 : 1 }}
            >
              {busy ? 'Saving…' : 'Save address'}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="px-7 py-3 text-[11px] font-black uppercase tracking-widest"
              style={{ border: '1px solid var(--border)', borderRadius: 99, color: 'var(--text-primary)', fontFamily: 'var(--font-outfit)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="p-6"
            style={{
              background: 'var(--surface)',
              border: `1px solid ${a.is_default ? 'color-mix(in srgb, var(--accent) 45%, var(--border))' : 'var(--border)'}`,
              borderRadius: 18,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
                style={{ background: 'var(--hover)', color: 'var(--text-muted)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
              >
                {a.label}
              </span>
              {a.is_default && (
                <span
                  className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white"
                  style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
                >
                  Default
                </span>
              )}
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {a.name}
            </p>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ''}
              <br />
              {a.city}, {a.state} {a.pincode}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              {a.phone}
            </p>
            <div className="flex gap-4 mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              {!a.is_default && (
                <button
                  onClick={async () => {
                    await setDefaultAddress(a.id)
                    await onChanged()
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--font-outfit)' }}
                >
                  <Star size={12} /> Make default
                </button>
              )}
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Remove this address?',
                    message: `${a.line1}, ${a.city} will be deleted from your saved addresses.`,
                    confirmLabel: 'Remove address',
                  })
                  if (!ok) return
                  await deleteAddress(a.id)
                  await onChanged()
                }}
                className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        ))}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex flex-col items-center justify-center gap-2 p-10"
            style={{ border: '1px dashed var(--border)', borderRadius: 18, color: 'var(--text-muted)', minHeight: 210 }}
          >
            <Plus size={22} style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-outfit)' }}>
              Add new address
            </span>
          </button>
        )}
      </div>
    </>
  )
}

/* ── Profile ─────────────────────────────────────────────────────────── */

function ProfileTab({
  email,
  fullName,
  phone,
  onSave,
}: {
  email: string
  fullName: string
  phone: string
  onSave: (patch: { full_name: string; phone: string }) => Promise<void>
}) {
  const [name, setName] = useState(fullName)
  const [tel, setTel] = useState(phone)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setName(fullName)
    setTel(phone)
  }, [fullName, phone])

  const field = {
    height: 50,
    background: 'color-mix(in srgb, var(--accent) 6%, var(--bg))',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text-primary)',
  } as const

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        try {
          await onSave({ full_name: name, phone: tel })
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        } finally {
          setBusy(false)
        }
      }}
      className="p-7 max-w-xl space-y-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}
    >
      <Labeled label="Full name">
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 text-sm outline-none" style={field} />
      </Labeled>
      <Labeled label="Mobile number">
        <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+91" className="w-full px-4 text-sm outline-none" style={field} />
      </Labeled>
      <Labeled label="Email (verified)">
        <input value={email} readOnly className="w-full px-4 text-sm outline-none" style={{ ...field, opacity: 0.6, cursor: 'not-allowed' }} />
      </Labeled>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="px-7 py-3 text-[11px] font-black uppercase tracking-widest text-white"
          style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--success)' }}>
            <CheckCircle2 size={14} /> Saved
          </span>
        )}
      </div>
    </form>
  )
}

/* ── Shared ──────────────────────────────────────────────────────────── */

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18 }}>
      <p
        className="text-[11px] font-black uppercase tracking-[0.18em] mb-4"
        style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-outfit)' }}
      >
        {title}
      </p>
      {children}
    </section>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Empty({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: typeof Package
  title: string
  body: string
  cta: { href: string; label: string }
}) {
  return (
    <div
      className="text-center py-20 px-6"
      style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 18 }}
    >
      <Icon size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 18px', opacity: 0.4 }} />
      <h3
        className="text-xl font-black uppercase mb-2"
        style={{ fontFamily: 'var(--font-outfit)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
      >
        {title}
      </h3>
      <p className="text-sm mb-7 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
        {body}
      </p>
      <Link
        href={cta.href}
        className="inline-block px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-white"
        style={{ background: 'var(--accent)', borderRadius: 99, fontFamily: 'var(--font-outfit)' }}
      >
        {cta.label}
      </Link>
    </div>
  )
}

export default AccountPage
