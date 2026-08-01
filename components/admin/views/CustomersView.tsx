'use client'

import { useState, useEffect } from 'react'
import { Users, Search } from 'lucide-react'
import { adminFetchCustomers, type AdminCustomer } from '@/lib/catalog-admin'
import { Panel, PageHeading, ErrorNote, EmptyState, SkeletonRows } from '@/components/admin/shared'

/** Deterministic tint per person, so the same customer keeps the same avatar. */
const TINTS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
const tintFor = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}

export default function CustomersView() {
  const [rows, setRows] = useState<AdminCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    adminFetchCustomers()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load customers.'))
      .finally(() => setLoading(false))
  }, [])

  const needle = q.trim().toLowerCase()
  const shown = needle
    ? rows.filter((c) => [c.full_name, c.email, c.phone].some((v) => v?.toLowerCase().includes(needle)))
    : rows

  return (
    <div>
      <PageHeading
        title="Customers"
        description="Everyone with an account. Guest checkouts appear under Orders instead."
        meta={loading ? 'Loading…' : `${rows.length} registered`}
      >
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--adm-text-3)' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email or phone"
            aria-label="Search customers"
            className="adm-input"
            style={{ width: 220, paddingLeft: 30, height: 34 }}
          />
        </div>
      </PageHeading>

      <ErrorNote>{error}</ErrorNote>

      <Panel className="overflow-hidden adm-rise adm-rise-1">
        {!loading && shown.length === 0 ? (
          <EmptyState
            icon={Users}
            title={rows.length === 0 ? 'No customers yet' : 'Nothing matches'}
            message={
              rows.length === 0
                ? 'Accounts show up here as soon as someone signs up.'
                : `No customer matches "${q.trim()}".`
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="adm-table" style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th style={{ width: 90 }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonRows cols={4} rows={5} />}
                {shown.map((c) => {
                  const label = c.full_name || c.email || '—'
                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                            style={{ width: 28, height: 28, borderRadius: 8, background: tintFor(c.id) }}
                            aria-hidden
                          >
                            {label.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-[12.5px] truncate" style={{ color: 'var(--adm-text)' }}>
                              {c.full_name || '—'}
                            </span>
                            <span className="block text-[11px] truncate" style={{ color: 'var(--adm-text-3)' }}>
                              {c.email || '—'}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="adm-num">{c.phone || '—'}</td>
                      <td className="adm-num whitespace-nowrap">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <span className={`adm-badge ${c.is_admin ? 'adm-badge-acc' : 'adm-badge-mute'}`}>
                          {c.is_admin ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
