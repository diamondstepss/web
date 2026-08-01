'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, PackageX, ExternalLink } from 'lucide-react'
import type { DbProduct } from '@/lib/catalog'
import { adminFetchProduct, createProduct, updateProduct, slugify } from '@/lib/catalog-admin'
import GalleryUploader from '@/components/admin/GalleryUploader'
import { AdminField, Panel, Eyebrow, ErrorNote, EmptyState, inr } from '@/components/admin/shared'

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

  const [f, setF] = useState({
    title: '', brand: '', slug: '', price: '', mrp: '', image: '',
    stock: '10', sizes: '', description: '', is_featured: false, is_active: true,
  })

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    adminFetchProduct(productId)
      .then((p) => {
        if (cancelled) return
        if (!p) return setNotFound(true)
        setProduct(p)
        setF({
          title: p.title ?? '', brand: p.brand ?? '', slug: p.slug ?? '',
          price: String(p.price ?? ''), mrp: String(p.mrp ?? ''), image: p.image ?? '',
          stock: String(p.stock ?? 0), sizes: (p.sizes ?? []).join(', '),
          description: p.description ?? '',
          is_featured: p.is_featured ?? false, is_active: p.is_active ?? true,
        })
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Could not load that product.'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [productId])

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [k]: e.target.value }))

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
      brand: f.brand.trim(),
      slug: f.slug.trim() || slugify(`${f.brand} ${f.title}`),
      price: Number(f.price),
      mrp: Number(f.mrp),
      image: f.image.trim() || null,
      stock: Number(f.stock) || 0,
      sizes: f.sizes.split(',').map((x) => x.trim()).filter(Boolean),
      description: f.description.trim() || null,
      is_featured: f.is_featured,
      is_active: f.is_active,
    }
    try {
      if (product) {
        await updateProduct(product.id, payload)
        router.push('/admin/products')
      } else {
        // Land on the edit page so the gallery uploader is immediately usable.
        const created = await createProduct(payload)
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
                  <input required value={f.brand} onChange={set('brand')} className="adm-input" placeholder="Nike" />
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

              <AdminField label="Description">
                <textarea value={f.description} onChange={set('description')} rows={4} className="adm-input" />
              </AdminField>
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
              <AdminField label="Stock">
                <input type="number" min="0" value={f.stock} onChange={set('stock')} className="adm-input adm-num" />
              </AdminField>
            </div>
            <div className="mt-4">
              <AdminField label="Sizes (UK)" hint="Comma separated. Leave blank for one-size items like bags.">
                <input value={f.sizes} onChange={set('sizes')} placeholder="6, 7, 8, 9, 10, 11" className="adm-input" />
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
