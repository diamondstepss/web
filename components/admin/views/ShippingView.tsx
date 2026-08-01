'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { fetchSettings, updateSettings, type StoreSettings } from '@/lib/catalog-admin'
import { inr, AdminField, Panel, Eyebrow, PageHeading, ErrorNote } from '@/components/admin/shared'

const DELIVERY: [keyof StoreSettings, string, string][] = [
  ['free_shipping_over', 'Free shipping over ₹', 'Orders above this ship free.'],
  ['shipping_fee', 'Shipping fee ₹', 'Charged below the threshold.'],
]

const COD: [keyof StoreSettings, string, string][] = [
  ['cod_fee', 'COD handling fee ₹', 'Added to cash-on-delivery orders.'],
  ['cod_max_order', 'COD max order ₹', 'COD is hidden above this value.'],
  ['partial_cod_advance', 'Partial COD advance ₹', 'Paid online; the rest on delivery.'],
  ['prepaid_discount_pct', 'Prepaid discount %', 'Incentive for paying in full up front.'],
]

export default function ShippingView() {
  const [s, setS] = useState<StoreSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
      .then(setS)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load settings.'))
  }, [])

  const field = (k: keyof StoreSettings, label: string, hint: string) => (
    <AdminField key={k} label={label} hint={hint}>
      <input
        type="number"
        min="0"
        value={String(s![k])}
        onChange={(e) => setS({ ...s!, [k]: Number(e.target.value) })}
        className="adm-input adm-num"
      />
    </AdminField>
  )

  if (!s) {
    return (
      <div>
        <PageHeading title="Shipping & payment" description="Applied at checkout, server-side." />
        <ErrorNote>{error}</ErrorNote>
        {!error && <span className="skeleton block max-w-2xl" style={{ height: 300, borderRadius: 14 }} />}
      </div>
    )
  }

  // Worked example, so the numbers above aren't abstract.
  const example = 1499
  const ship = example >= s.free_shipping_over ? 0 : s.shipping_fee
  const prepaidSave = Math.round((example * s.prepaid_discount_pct) / 100)

  return (
    <div>
      <PageHeading
        title="Shipping & payment"
        description="These drive every price the customer sees. Checkout recalculates from these values server-side, so they're authoritative."
        meta="Live at checkout"
      />

      <ErrorNote>{error}</ErrorNote>

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          setError(null)
          try {
            await updateSettings(s)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed.')
          } finally {
            setBusy(false)
          }
        }}
        className="grid lg:grid-cols-[minmax(0,1fr)_270px] gap-3.5 items-start"
      >
        <div className="space-y-3.5 min-w-0">
          <Panel className="p-5 adm-rise adm-rise-1">
            <Eyebrow className="mb-4">Delivery</Eyebrow>
            <div className="grid sm:grid-cols-2 gap-4">{DELIVERY.map(([k, l, h]) => field(k, l, h))}</div>
          </Panel>

          <Panel className="p-5 adm-rise adm-rise-2">
            <Eyebrow className="mb-4">Cash on delivery</Eyebrow>

            <div className="space-y-2.5 mb-5">
              {(
                [
                  ['cod_enabled', 'Cash on Delivery enabled', 'Customers can pay the courier on arrival.'],
                  ['partial_cod_enabled', 'Partial COD enabled', 'Take an advance online, collect the balance on delivery.'],
                ] as const
              ).map(([k, label, hint]) => (
                <label
                  key={k}
                  className="flex items-start gap-2.5 px-3 py-2.5"
                  style={{ cursor: 'pointer', borderRadius: 'var(--adm-r-sm)', background: 'var(--adm-inset)', border: '1px solid var(--adm-line)' }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(s[k])}
                    onChange={(e) => setS({ ...s, [k]: e.target.checked })}
                    className="mt-0.5"
                    style={{ accentColor: 'var(--adm-accent)' }}
                  />
                  <span>
                    <span className="block text-[12.5px]" style={{ color: 'var(--adm-text)' }}>{label}</span>
                    <span className="block text-[10.5px] mt-0.5" style={{ color: 'var(--adm-text-3)' }}>{hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4" style={{ opacity: s.cod_enabled || s.partial_cod_enabled ? 1 : 0.5 }}>
              {COD.map(([k, l, h]) => field(k, l, h))}
            </div>
          </Panel>
        </div>

        <div className="space-y-3.5">
          <Panel className="p-5 adm-rise adm-rise-3">
            <Eyebrow className="mb-4">Worked example</Eyebrow>
            <p className="text-[11.5px] mb-3" style={{ color: 'var(--adm-text-3)' }}>
              {`A ${inr(example)} order, today’s settings:`}
            </p>
            <dl className="space-y-2 text-[12px]">
              {[
                ['Shipping', ship === 0 ? 'Free' : inr(ship)],
                ['Pay in full', inr(example + ship - prepaidSave)],
                ...(s.prepaid_discount_pct > 0 ? [['Prepaid saving', `−${inr(prepaidSave)}`] as [string, string]] : []),
                ...(s.cod_enabled ? [['COD total', inr(example + ship + s.cod_fee)] as [string, string]] : []),
                ...(s.partial_cod_enabled
                  ? [
                      ['Pay now', inr(s.partial_cod_advance)] as [string, string],
                      ['On delivery', inr(Math.max(example + ship + s.cod_fee - s.partial_cod_advance, 0))] as [string, string],
                    ]
                  : []),
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt style={{ color: 'var(--adm-text-2)' }}>{k}</dt>
                  <dd className="adm-num font-semibold" style={{ color: 'var(--adm-text)' }}>{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <div className="flex items-center gap-3 adm-rise adm-rise-4">
            <button type="submit" disabled={busy} className="adm-btn adm-btn-primary flex-1" style={{ height: 40 }}>
              {busy ? 'Saving…' : 'Save settings'}
            </button>
          </div>
          {saved && (
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: 'var(--adm-ok)' }}>
              <Check size={13} /> Saved — storefront updated
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
