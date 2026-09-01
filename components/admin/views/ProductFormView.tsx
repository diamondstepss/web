'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, PackageX, ExternalLink } from 'lucide-react'
import type { DbProduct } from '@/lib/catalog'
import {
  adminFetchProduct,
  adminFetchBrands,
  createProduct,
  updateProduct,
  slugify,
  normalizeBrand,
  fetchSizeStock,
  saveSizeStock,
  fetchSettings,
} from '@/lib/catalog-admin'
import GalleryUploader from '@/components/admin/GalleryUploader'
import AiDescriptionButton from '@/components/admin/AiDescriptionButton'
import { AdminField, Panel, Eyebrow, ErrorNote, EmptyState, inr } from '@/components/admin/shared'

/**
 * Offered as toggleable rows on a new footwear product, and as the default
 * stocked range — keyed by the store's size system (Admin → Shipping →
 * Catalog), not hardcoded to one scale. Anything outside a candidate list can
 * still be added by typing it into "Add a size" below.
 */
const CANDIDATE_SIZES_BY_SYSTEM: Record<'UK' | 'EU' | 'US', string[]> = {
  UK: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  EU: [
    '34.5', '35.5', '36', '37', '38', '39', '40', '40.5', '41', '42', '43',
    '44', '44.5', '45', '46', '47',
  ],
  US: ['6', '7', '8', '9', '10', '11', '12', '13'],
}

const DEFAULT_SIZES_BY_SYSTEM: Record<'UK' | 'EU' | 'US', string[]> = {
  UK: ['6', '7', '8', '9', '10', '11'],
  EU: ['39', '40.5', '42', '43', '44.5', '46'],
  US: ['7', '8', '9', '10', '11', '12'],
}

/**
 * Create and edit both live at a real URL (/admin/products/new and
 * /admin/products/[id]), so a reload keeps you on the product you were editing
 * instead of bouncing back to the dashboard.
 */
export default function ProductFormView({ productId }: { productId?: string }) {
  const router = useRouter()
  const [product, setProduct] = useState<DbProduct | null>(null)
  const [loading, setLoading] = useState(Boolean(productId))
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // No `image` field here on purpose: the gallery uploader (lib/media.ts) is
  // the sole owner of products.image, syncing it as photos are added or
  // removed. A stale copy in this form's local state would silently
  // overwrite that on every unrelated save (title, price, sizes...).
  const [f, setF] = useState({
    title: '', brand: '', slug: '', price: '', mrp: '',
    stock: '10', description: '', is_featured: false, is_active: true,
  })

  // Per-size stock, keyed by size — a size is "stocked" if it has a key here
  // at all, regardless of whether the value is currently 0. Kept apart from
  // `f` because it isn't a column on `products`; it's its own table. Starts
  // empty (an accessory) for a brand-new product, same as the field this
  // replaced used to.
  const [sizeStock, setSizeStock] = useState<Record<string, string>>({})
  const [newSize, setNewSize] = useState('')
  const [brands, setBrands] = useState<string[]>([])
  const [sizeSystem, setSizeSystem] = useState<'UK' | 'EU' | 'US'>('EU')

  useEffect(() => {
    adminFetchBrands().then(setBrands).catch(() => {
      /* datalist is a nice-to-have — the save-time normalization still runs without it */
    })
  }, [])

  useEffect(() => {
    fetchSettings()
      .then((s) => s && setSizeSystem(s.size_system))
      .catch(() => {
        /* the candidate list just falls back to EU — the free-text "Add a size" still works */
      })
  }, [])

  const candidateSizes = CANDIDATE_SIZES_BY_SYSTEM[sizeSystem]
  const defaultSizeStock: Record<string, string> = Object.fromEntries(
    DEFAULT_SIZES_BY_SYSTEM[sizeSystem].map((s) => [s, '0']),
  )

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    Promise.all([adminFetchProduct(productId), fetchSizeStock(productId)])
      .then(([p, rows]) => {
        if (cancelled) return
        if (!p) return setNotFound(true)
        setProduct(p)
        setF({
          title: p.title ?? '', brand: p.brand ?? '', slug: p.slug ?? '',
          price: String(p.price ?? ''), mrp: String(p.mrp ?? ''),
          stock: String(p.stock ?? 0),
          description: p.description ?? '',
          is_featured: p.is_featured ?? false, is_active: p.is_active ?? true,
        })
        // A footwear product saved before this feature existed has sizes on
        // the product row but no product_size_stock rows yet (the migration
        // seeds those at 0, but only once it's actually been run) — fall
        // back to the product's own size list so the picker still shows the
        // right sizes instead of silently relabelling it an accessory.
        if (rows.length) {
          setSizeStock(Object.fromEntries(rows.map((r) => [r.size, String(r.stock)])))
        } else if (p.sizes?.length) {
          setSizeStock(Object.fromEntries(p.sizes.map((s) => [s, '0'])))
        } else {
          setSizeStock({})
        }
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load that product.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [productId])

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }))

  // An accessory is simply a product with no sizes — the same condition the
  // storefront, cart and order emails already use to skip the size picker.
  const isAccessory = Object.keys(sizeStock).length === 0

  const toggleSize = (size: string) =>
    setSizeStock((prev) => {
      const next = { ...prev }
      if (size in next) delete next[size]
      else next[size] = '0'
      return next
    })

  const totalSizeStock = Object.values(sizeStock).reduce((n, v) => n + (Number(v) || 0), 0)

  // Live discount readout — saves doing the arithmetic in your head.
  const priceN = Number(f.price) || 0
  const mrpN = Number(f.mrp) || 0
  const discount = mrpN > priceN && mrpN > 0 ? Math.round(((mrpN - priceN) / mrpN) * 100) : 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const payload = {
      title: f.title.trim(),
      brand: normalizeBrand(f.brand, brands),
      slug: f.slug.trim() || slugify(`${f.brand} ${f.title}`),
      price: Number(f.price),
      mrp: Number(f.mrp),
      // For footwear this is a placeholder — saveSizeStock below triggers the
      // database to recompute it as the real sum a moment later. Sending the
      // honest running total rather than the stale field just means nothing
      // briefly shows a wrong number in between.
      stock: isAccessory ? Number(f.stock) || 0 : totalSizeStock,
      sizes: Object.keys(sizeStock).sort((a, b) => Number(a) - Number(b)),
      description: f.description.trim() || null,
      is_featured: f.is_featured,
      is_active: f.is_active,
    }
    const sizeRows = isAccessory
      ? []
      : Object.entries(sizeStock).map(([size, stock]) => ({
          size,
          stock: Math.max(0, Math.floor(Number(stock)) || 0),
        }))
    try {
      if (product) {
        await updateProduct(product.id, payload)
        await saveSizeStock(product.id, sizeRows)
        router.push('/admin/products')
      } else {
        // Land on the edit page so the gallery uploader is immediately usable.
        const created = await createProduct(payload)
        await saveSizeStock(created.id, sizeRows)
        router.push(`/admin/products/${created.id}`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-3">
        <span className="skeleton block" style={{ height: 26, width: 220, borderRadius: 7 }} />
        <span className="skeleton block" style={{ height: 300, borderRadius: 14 }} />
      </div>
    )
  }

  if (notFound) {
    return (
      <Panel>
        <EmptyState
          icon={PackageX}
          title="That product no longer exists"
          message="It may have been deleted from another tab or by another admin."
          action={<Link href="/admin/products" className="adm-btn adm-btn-primary">Back to products</Link>}
        />
      </Panel>
    )
  }

  return (
    <div>
      <header className="adm-rise mb-6">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium mb-3 transition-opacity hover:opacity-70"
          style={{ color: 'var(--adm-text-3)' }}
        >
          <ArrowLeft size={13} /> Products
        </Link>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="adm-display text-[26px] leading-none" style={{ color: 'var(--adm-text)' }}>
            {product ? f.title || 'Edit product' : 'New product'}
          </h1>
          {product && f.is_active && (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="adm-btn adm-btn-ghost"
              style={{ height: 30 }}
            >
              <ExternalLink size={12} /> View live
            </Link>
          )}
        </div>
      </header>

      <form onSubmit={submit} className="grid lg:grid-cols-[minmax(0,1fr)_306px] gap-3.5 items-start">
        <div className="space-y-3.5 min-w-0">
          <ErrorNote>{error}</ErrorNote>

          <Panel className="p-5 adm-rise adm-rise-1">
            <Eyebrow className="mb-4">Details</Eyebrow>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <AdminField label="Title">
                  <input required value={f.title} onChange={set('title')} className="adm-input" placeholder="Air Max 90 White" />
                </AdminField>
                <AdminField label="Brand">
                  <input
                    required
                    list="brand-options"
                    value={f.brand}
                    onChange={set('brand')}
                    className="adm-input"
                    placeholder="Nike"
                  />
                  <datalist id="brand-options">
                    {brands.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </AdminField>
              </div>

              <AdminField label="URL slug" hint="Leave blank and it's generated from the brand and title.">
                <input
                  value={f.slug}
                  onChange={set('slug')}
                  placeholder={slugify(`${f.brand} ${f.title}`) || 'auto'}
                  className="adm-input font-mono text-[12px]"
                />
              </AdminField>

              {/* Not an AdminField: that renders a <label>, and a button inside
                  a label steals the click meant for the textarea. */}
              <div>
                <div className="flex items-end justify-between gap-3 mb-1.5">
                  <span className="text-[11.5px] font-medium" style={{ color: 'var(--adm-text-2)' }}>
                    Description
                  </span>
                  <AiDescriptionButton
                    productId={product?.id}
                    hasExisting={f.description.trim().length > 0}
                    onResult={(text) => setF((prev) => ({ ...prev, description: text }))}
                  />
                </div>
                <textarea
                  id="product-description"
                  value={f.description}
                  onChange={set('description')}
                  rows={4}
                  className="adm-input"
                />
              </div>
            </div>
          </Panel>

          <Panel className="p-5 adm-rise adm-rise-2">
            <div className="flex items-center justify-between mb-4">
              <Eyebrow>Pricing &amp; stock</Eyebrow>
              {discount > 0 && (
                <span className="adm-badge adm-badge-acc">
                  {discount}% off · saves {inr(mrpN - priceN)}
                </span>
              )}
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <AdminField label="Selling price ₹">
                <input required type="number" min="0" value={f.price} onChange={set('price')} className="adm-input adm-num" />
              </AdminField>
              <AdminField label="MRP ₹">
                <input required type="number" min="0" value={f.mrp} onChange={set('mrp')} className="adm-input adm-num" />
              </AdminField>
              <AdminField label="Stock" hint={isAccessory ? undefined : 'Set from the sizes below — not edited directly.'}>
                <input
                  type="number"
                  min="0"
                  value={isAccessory ? f.stock : totalSizeStock}
                  onChange={set('stock')}
                  disabled={!isAccessory}
                  className="adm-input adm-num"
                  style={isAccessory ? undefined : { opacity: 0.6 }}
                />
              </AdminField>
            </div>
            <div className="mt-4">
              {/* Accessory is not a column — it is "this product has no sizes",
                  which is how the storefront, the cart and the emails already
                  decide whether to ask for one. Making it an explicit switch
                  rather than an empty text box means the shop owner is never
                  guessing what a blank field does. */}
              <AdminField
                label={`Sizes & stock (${sizeSystem})`}
                hint={
                  isAccessory
                    ? 'Accessories are sold one-size, so no size is asked for at checkout.'
                    : 'Check each size you stock and enter how many are actually left of it — the storefront picker will grey out anything at zero.'
                }
              >
                <label className="flex items-center gap-2 mb-3 text-[12px]" style={{ color: 'var(--adm-text-2)' }}>
                  <input
                    type="checkbox"
                    checked={isAccessory}
                    onChange={(e) => setSizeStock(e.target.checked ? {} : defaultSizeStock)}
                  />
                  This is an accessory — one size, no size picker
                </label>

                {!isAccessory && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[...new Set([...candidateSizes, ...Object.keys(sizeStock)])]
                      .sort((a, b) => Number(a) - Number(b))
                      .map((s) => {
                        const included = s in sizeStock
                        return (
                          <div
                            key={s}
                            className="flex items-center gap-1.5 px-2 py-1.5"
                            style={{ border: '1px solid var(--adm-line)', borderRadius: 'var(--adm-r-sm)' }}
                          >
                            <input
                              type="checkbox"
                              checked={included}
                              onChange={() => toggleSize(s)}
                              style={{ accentColor: 'var(--adm-accent)' }}
                            />
                            <span className="text-[12px] w-8 shrink-0" style={{ color: 'var(--adm-text)' }}>
                              {s}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={sizeStock[s] ?? ''}
                              onChange={(e) => setSizeStock((prev) => ({ ...prev, [s]: e.target.value }))}
                              disabled={!included}
                              className="adm-input adm-num flex-1 min-w-0"
                              style={{ height: 28, opacity: included ? 1 : 0.4 }}
                            />
                          </div>
                        )
                      })}
                  </div>
                )}

                {!isAccessory && (
                  <div className="flex gap-1.5 mt-2.5">
                    <input
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="Add a size, e.g. 4.5 or 13"
                      className="adm-input flex-1"
                      style={{ height: 30 }}
                    />
                    <button
                      type="button"
                      disabled={!newSize.trim() || newSize.trim() in sizeStock}
                      onClick={() => {
                        setSizeStock((prev) => ({ ...prev, [newSize.trim()]: '0' }))
                        setNewSize('')
                      }}
                      className="adm-btn adm-btn-ghost"
                      style={{ height: 30, padding: '0 12px' }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </AdminField>
            </div>
          </Panel>
        </div>

        <div className="space-y-3.5">
          <Panel className="p-5 adm-rise adm-rise-2">
            <Eyebrow className="mb-4">Visibility</Eyebrow>
            {(
              [
                ['is_active', 'Live on the site', 'Uncheck to keep it as a draft.'],
                ['is_featured', 'Featured on homepage', 'Shows in the featured rail.'],
              ] as const
            ).map(([k, label, hint]) => (
              <label key={k} className="flex items-start gap-2.5 mb-3 last:mb-0" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.checked })}
                  className="mt-0.5"
                  style={{ accentColor: 'var(--adm-accent)' }}
                />
                <span>
                  <span className="block text-[12.5px]" style={{ color: 'var(--adm-text)' }}>{label}</span>
                  <span className="block text-[10.5px] mt-0.5" style={{ color: 'var(--adm-text-3)' }}>{hint}</span>
                </span>
              </label>
            ))}
          </Panel>

          {product ? (
            <div className="adm-rise adm-rise-3">
              <GalleryUploader productId={product.id} />
            </div>
          ) : (
            <Panel className="p-5 adm-rise adm-rise-3">
              <Eyebrow className="mb-2">Gallery</Eyebrow>
              <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--adm-text-2)' }}>
                Save first — you&apos;ll land on this product&apos;s page, where you can upload up to 5 images.
              </p>
            </Panel>
          )}

          <div className="flex gap-2 adm-rise adm-rise-4">
            <button type="submit" disabled={busy} className="adm-btn adm-btn-primary flex-1" style={{ height: 40 }}>
              {busy ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>
            <Link href="/admin/products" className="adm-btn adm-btn-ghost" style={{ height: 40 }}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
