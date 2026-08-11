'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, Copy, Check, ArrowUpRight, Lock, ChevronRight } from 'lucide-react'
import { Panel, Eyebrow, PageHeading } from '@/components/admin/shared'
import type { Integration } from '@/lib/server/integrations'

/**
 * Integration status, computed on the server from the actual environment.
 *
 * This page never shows or accepts a secret. Keys are set on the host, so the
 * worst a compromised admin session can do here is read which services are
 * configured — not what their credentials are.
 */

/** One integration. Identical in both sections — only the grouping differs. */
function IntegrationCard({ int, rise }: { int: Integration; rise: number }) {
  return (
    <Panel className={`p-5 adm-rise adm-rise-${Math.min(rise, 4)}`}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <h2 className="adm-display text-[15px]" style={{ color: 'var(--adm-text)' }}>{int.name}</h2>
        <span className={`adm-badge ${int.status === 'READY' ? 'adm-badge-ok' : 'adm-badge-warn'}`}>
          {int.status === 'READY' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
          {int.status === 'READY' ? 'Configured' : 'Incomplete'}
        </span>
      </div>

      <p className="text-[12px] mb-4" style={{ color: 'var(--adm-text-2)' }}>{int.purpose}</p>

      <div className="space-y-1.5">
        {int.fields.map((f) => (
          <div
            key={f.env}
            className="flex items-center justify-between gap-3 px-3 py-2"
            style={{ background: 'var(--adm-inset)', borderRadius: 8, border: '1px solid var(--adm-line)' }}
          >
            <span className="min-w-0">
              <span className="block text-[12px]" style={{ color: 'var(--adm-text)' }}>
                {f.label}
                {!f.required && (
                  <span className="text-[10px] ml-1.5" style={{ color: 'var(--adm-text-3)' }}>optional</span>
                )}
              </span>
              <span className="block font-mono text-[10px] truncate mt-0.5" style={{ color: 'var(--adm-text-3)' }}>
                {f.env}
              </span>
            </span>
            <span
              className={`adm-badge shrink-0 ${
                f.set ? 'adm-badge-ok' : f.required ? 'adm-badge-bad' : 'adm-badge-mute'
              }`}
            >
              {f.set ? 'Set' : 'Not set'}
            </span>
          </div>
        ))}
      </div>

      {int.note && (
        <p className="text-[11px] mt-4 pt-3 leading-relaxed" style={{ borderTop: '1px solid var(--adm-line)', color: 'var(--adm-text-3)' }}>
          {int.note}
        </p>
      )}
    </Panel>
  )
}

export default function SettingsView({
  integrations,
  webhookUrl,
  environment,
}: {
  integrations: Integration[]
  webhookUrl: string
  environment: { instamojoMode: string; siteUrl: string | null; nodeEnv?: string }
}) {
  const [copied, setCopied] = useState(false)
  const incomplete = integrations.filter((i) => i.status === 'INCOMPLETE')
  const ready = integrations.length - incomplete.length

  const core = integrations.filter((i) => !i.advanced)
  const advanced = integrations.filter((i) => i.advanced)
  // Open on arrival when something down there is broken. A missing Supabase key
  // takes the whole site down, and hiding that behind a click would be perverse.
  const advancedBroken = advanced.some((i) => i.status === 'INCOMPLETE')
  const [advancedOpen, setAdvancedOpen] = useState(advancedBroken)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the URL is selectable in the field regardless */
    }
  }

  return (
    <div>
      <PageHeading
        title="Settings"
        description="Credentials live in the server environment, not the database — they're never sent to the browser and can't be changed from here. This page reports which ones are present."
        meta={`${ready}/${integrations.length} ready`}
      />

      {incomplete.length > 0 && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 mb-3.5 adm-rise"
          style={{
            background: 'color-mix(in srgb, var(--adm-warn) 11%, transparent)',
            border: '1px solid color-mix(in srgb, var(--adm-warn) 26%, transparent)',
            color: 'var(--adm-warn)',
            borderRadius: 'var(--adm-r-sm)',
          }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <p className="text-[12px] leading-relaxed">
            <strong>{incomplete.map((i) => i.name).join(', ')}</strong>{' '}
            {incomplete.length === 1 ? 'is' : 'are'} missing credentials. Add them to the host environment
            (<code className="font-mono">.env.local</code> in development) and restart the server.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-3.5 mb-3.5">
        {core.map((int, i) => (
          <IntegrationCard key={int.key} int={int} rise={i + 1} />
        ))}
      </div>

      {advanced.length > 0 && (
        <details
          open={advancedOpen}
          onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}
          className="adm-rise adm-rise-3 mb-3.5"
        >
          <summary
            className="flex items-center gap-2 cursor-pointer select-none list-none px-4 py-3"
            style={{
              background: 'var(--adm-panel)',
              border: '1px solid var(--adm-line)',
              borderRadius: 'var(--adm-r-sm)',
              color: 'var(--adm-text-2)',
            }}
          >
            <ChevronRight
              size={14}
              className="shrink-0"
              style={{
                transform: advancedOpen ? 'rotate(90deg)' : 'none',
                transition: 'transform 180ms ease',
              }}
            />
            <span className="text-[12.5px] font-medium" style={{ color: 'var(--adm-text)' }}>
              Advanced
            </span>
            <span className="text-[11.5px]" style={{ color: 'var(--adm-text-3)' }}>
              {advanced.map((i) => i.name).join(' · ')} — set once at setup
            </span>
            <span className="ml-auto flex items-center gap-1.5 shrink-0">
              {advancedBroken ? (
                <span className="adm-badge adm-badge-warn">
                  <AlertTriangle size={11} /> Needs attention
                </span>
              ) : (
                <span className="adm-badge adm-badge-ok">
                  <CheckCircle2 size={11} /> All configured
                </span>
              )}
            </span>
          </summary>

          <div className="grid lg:grid-cols-2 gap-3.5 mt-3.5">
            {advanced.map((int, i) => (
              <IntegrationCard key={int.key} int={int} rise={i + 1} />
            ))}
          </div>
        </details>
      )}

      <Panel className="p-5 mb-3.5 adm-rise adm-rise-4">
        <Eyebrow className="mb-1.5">Instamojo webhook</Eyebrow>
        <p className="text-[12px] mb-3.5 max-w-2xl leading-relaxed" style={{ color: 'var(--adm-text-2)' }}>
          Paste this into the Instamojo dashboard. An order is only ever marked paid by this webhook — never by the
          browser redirect, which can be forged or simply never arrive.
        </p>
        <div className="flex gap-2 flex-wrap">
          <input
            readOnly
            value={webhookUrl}
            aria-label="Instamojo webhook URL"
            onFocus={(e) => e.currentTarget.select()}
            className="adm-input font-mono flex-1"
            style={{ minWidth: 240, fontSize: 12 }}
          />
          <button onClick={copy} className="adm-btn adm-btn-ghost">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </Panel>

      <Panel className="p-5 adm-rise adm-rise-4">
        <Eyebrow className="mb-4">Environment</Eyebrow>
        <dl className="grid sm:grid-cols-3 gap-4 text-[12px]">
          <div>
            <dt style={{ color: 'var(--adm-text-3)' }}>Instamojo mode</dt>
            <dd className="mt-1.5">
              <span className={`adm-badge ${environment.instamojoMode === 'production' ? 'adm-badge-ok' : 'adm-badge-warn'}`}>
                {environment.instamojoMode}
              </span>
            </dd>
          </div>
          <div className="min-w-0">
            <dt style={{ color: 'var(--adm-text-3)' }}>Site URL</dt>
            <dd className="font-semibold mt-1.5 truncate font-mono text-[11.5px]" style={{ color: 'var(--adm-text)' }}>
              {environment.siteUrl ?? 'not set'}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--adm-text-3)' }}>Build</dt>
            <dd className="font-semibold mt-1.5" style={{ color: 'var(--adm-text)' }}>{environment.nodeEnv}</dd>
          </div>
        </dl>

        <div
          className="flex items-start gap-2.5 mt-5 pt-4 text-[11.5px] leading-relaxed"
          style={{ borderTop: '1px solid var(--adm-line)', color: 'var(--adm-text-3)' }}
        >
          <Lock size={13} className="shrink-0 mt-0.5" />
          <p>
            Shipping fees, COD limits and the prepaid discount are editable — they live in the database, not the
            environment.{' '}
            <Link href="/admin/shipping" className="inline-flex items-center gap-0.5 font-semibold" style={{ color: 'var(--adm-accent)' }}>
              Shipping &amp; payment <ArrowUpRight size={11} />
            </Link>
          </p>
        </div>
      </Panel>
    </div>
  )
}
