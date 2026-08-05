'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Percent , MoveHorizontal } from 'lucide-react'
import {
  adminFetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
} from '@/lib/catalog-admin'
import { useConfirm } from '@/components/ConfirmDialog'
import {
  inr,
  AdminField,
  Panel,
  Eyebrow,
  PageHeading,
  ErrorNote,
  EmptyState,
  SkeletonRows,
} from '@/components/admin/shared'

export default function CouponsView() {
  const confirm = useConfirm()
  const [rows, setRows] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    code: '',
    type: 'PERCENT' as Coupon['type'],
    value: '10',
    min_order: '999',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await adminFetchCoupons())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load coupons.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const active = rows.filter((c) => c.is_active).length

  // Plain-language preview of what the code will actually do.
  const preview =
    form.type === 'FREESHIP'
      ? `Free shipping on orders over ${inr(form.min_order || 0)}`
      : form.type === 'PERCENT'
        ? `${form.value || 0}% off orders over ${inr(form.min_order || 0)}`
        : `${inr(form.value || 0)} off orders over ${inr(form.min_order || 0)}`

  return (
    <div>
      <PageHeading
        title="Coupons"
        description="Discount codes customers enter at checkout. The discount is recalculated server-side, so a tampered code can't be redeemed."
        meta={loading ? 'Loading…' : `${active} active · ${rows.length} total`}
      />

      <ErrorNote>{error}</ErrorNote>

      <Panel className="p-5 mb-3.5 adm-rise adm-rise-1">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <Eyebrow>New coupon</Eyebrow>
          {form.code.trim() && (
            <span className="text-[11.5px]" style={{ color: 'var(--adm-text-2)' }}>
              <span className="font-mono font-semibold" style={{ color: 'var(--adm-accent)' }}>
                {form.code.trim().toUpperCase()}
              </span>
              {' → '}{preview}
            </span>
          )}
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setError(null)
            try {
              await createCoupon({
                code: form.code.trim().toUpperCase(),
                type: form.type,
                value: form.type === 'FREESHIP' ? 0 : Number(form.value),
                min_order: Number(form.min_order),
                usage_limit: null,
                is_active: true,
              })
              setForm({ ...form, code: '' })
              await load()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Save failed.')
            } finally {
              setBusy(false)
            }
          }}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start"
        >
          <AdminField label="Code">
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="WELCOME10"
              className="adm-input uppercase font-mono"
            />
          </AdminField>
          <AdminField label="Type">
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Coupon['type'] })}
              className="adm-input"
            >
              <option value="PERCENT">Percent off</option>
              <option value="FLAT">Flat ₹ off</option>
              <option value="FREESHIP">Free shipping</option>
            </select>
          </AdminField>
          <AdminField label={form.type === 'PERCENT' ? 'Percent' : 'Amount ₹'}>
            <input
              type="number"
              min="0"
              value={form.type === 'FREESHIP' ? '' : form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="adm-input adm-num"
              disabled={form.type === 'FREESHIP'}
              placeholder={form.type === 'FREESHIP' ? 'n/a' : undefined}
            />
          </AdminField>
          <AdminField label="Min order ₹">
            <input
              type="number"
              min="0"
              value={form.min_order}
              onChange={(e) => setForm({ ...form, min_order: e.target.value })}
              className="adm-input adm-num"
            />
          </AdminField>
          <button type="submit" disabled={busy} className="adm-btn adm-btn-primary" style={{ marginTop: 22 }}>
            <Plus size={13} /> {busy ? 'Saving…' : 'Add'}
          </button>
        </form>
      </Panel>

      <Panel className="overflow-hidden adm-rise adm-rise-2">
        {!loading && rows.length === 0 ? (
          <EmptyState
            icon={Percent}
            title="No coupons yet"
            message="Add a code above and it works at checkout immediately."
          />
        ) : (
          <>
          <p className="adm-swipe-hint"><MoveHorizontal size={11} /> Swipe the table sideways to see every column</p>
          <div className="overflow-x-auto">
            <table className="adm-table" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th className="text-right">Min order</th>
                  <th className="text-right">Used</th>
                  <th style={{ width: 80 }}>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows cols={6} rows={4} />}
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono font-semibold" style={{ color: 'var(--adm-accent)' }}>{c.code}</td>
                    <td style={{ color: 'var(--adm-text)' }}>
                      {c.type === 'PERCENT'
                        ? <span className="adm-num">{c.value}% off</span>
                        : c.type === 'FLAT'
                          ? <span className="adm-num">{inr(c.value)} off</span>
                          : 'Free shipping'}
                    </td>
                    <td className="text-right adm-num">{inr(c.min_order)}</td>
                    <td className="text-right adm-num">
                      {c.used_count}
                      {c.usage_limit ? <span style={{ color: 'var(--adm-text-3)' }}> / {c.usage_limit}</span> : ''}
                    </td>
                    <td>
                      <button
                        onClick={async () => {
                          await updateCoupon(c.id, { is_active: !c.is_active })
                          await load()
                        }}
                        className={`adm-badge ${c.is_active ? 'adm-badge-ok' : 'adm-badge-mute'}`}
                      >
                        {c.is_active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Delete coupon?',
                            message: `${c.code} will stop working immediately for anyone trying to use it.`,
                            confirmLabel: 'Delete coupon',
                          })
                          if (ok) {
                            await deleteCoupon(c.id)
                            await load()
                          }
                        }}
                        className="adm-btn adm-btn-danger"
                        style={{ height: 27, padding: '0 10px' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Panel>
    </div>
  )
}
