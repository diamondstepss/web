import 'server-only'

/**
 * Integration status for the admin Settings page.
 *
 * Reports only whether each secret is PRESENT — never its value. The result is
 * rendered in the browser, so leaking a key here would leak it to every admin
 * session and anything that scrapes the HTML.
 *
 * Credentials are deliberately not editable from the UI: they live in the
 * host's environment, so a bad paste can't take payments down and there is no
 * write path an attacker could target.
 */

export interface IntegrationField {
  env: string
  label: string
  set: boolean
  required: boolean
}

export interface Integration {
  key: string
  name: string
  purpose: string
  fields: IntegrationField[]
  /** READY only when every required field is present. */
  status: 'READY' | 'INCOMPLETE'
  note?: string
  docsUrl?: string
  /**
   * Infrastructure the shop owner never touches, kept out of the way.
   *
   * Instamojo and Shiprocket are theirs — they log into those dashboards and
   * rotate those keys. Supabase and Resend are ours: set once at setup and
   * never thought about again. Both still belong on this page, because when
   * one does break it is the first place to look.
   */
  advanced?: boolean
}

const present = (v: string | undefined) => Boolean(v && v.trim())

function build(
  key: string,
  name: string,
  purpose: string,
  fields: Omit<IntegrationField, 'set'>[],
  extra: { note?: string; docsUrl?: string; advanced?: boolean } = {},
): Integration {
  const resolved = fields.map((f) => ({ ...f, set: present(process.env[f.env]) }))
  const status = resolved.every((f) => !f.required || f.set) ? 'READY' : 'INCOMPLETE'
  return { key, name, purpose, fields: resolved, status, ...extra }
}

export function getIntegrations(): Integration[] {
  return [
    build(
      'supabase',
      'Supabase',
      'Database, auth and product image storage.',
      [
        { env: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Project URL', required: true },
        { env: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', label: 'Publishable key', required: true },
        { env: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Service role key (server only)', required: true },
      ],
      { advanced: true },
    ),
    build(
      'instamojo',
      'Instamojo',
      'Online card, UPI and netbanking payments.',
      [
        { env: 'INSTAMOJO_API_KEY', label: 'API key', required: true },
        { env: 'INSTAMOJO_AUTH_TOKEN', label: 'Auth token', required: true },
        { env: 'INSTAMOJO_SALT', label: 'Salt (webhook verification)', required: true },
        { env: 'INSTAMOJO_ENV', label: 'Environment (test / production)', required: false },
      ],
      { note: 'Point the Instamojo webhook at the URL below or paid orders will never be confirmed.' },
    ),
    build(
      'shiprocket',
      'Shiprocket',
      'Pushes paid orders for pickup and delivery.',
      [
        { env: 'SHIPROCKET_EMAIL', label: 'API email', required: true },
        { env: 'SHIPROCKET_PASSWORD', label: 'API password', required: true },
        { env: 'SHIPROCKET_PICKUP', label: 'Pickup location name', required: false },
      ],
      { note: 'A failed push never blocks a payment — the order still lands, and the error is logged.' },
    ),
    build(
      'resend',
      'Resend',
      'Order confirmation and login emails.',
      [
        { env: 'RESEND_API_KEY', label: 'API key', required: true },
        { env: 'RESEND_FROM', label: 'From address', required: false },
      ],
      { advanced: true },
    ),
  ]
}

/** The real webhook route. Used by the Settings page so it can be copied out. */
export function getWebhookUrls() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://diamondstepss.com').replace(/\/$/, '')
  return {
    instamojo: `${base}/api/webhooks/instamojo`,
  }
}

export function getEnvironment() {
  return {
    instamojoMode: (process.env.INSTAMOJO_ENV || 'test').toLowerCase(),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
    nodeEnv: process.env.NODE_ENV,
  }
}
