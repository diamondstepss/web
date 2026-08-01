'use client'

import { Database, ExternalLink } from 'lucide-react'

const STEPS = [
  {
    title: 'Create a Supabase project',
    body: 'Go to supabase.com, create a project, and open Project Settings → API.',
  },
  {
    title: 'Add the keys',
    body: 'Copy .env.example to .env.local in ds_figma/ and paste in your Project URL and anon public key.',
  },
  {
    title: 'Run the migrations',
    body: 'In the SQL Editor, run supabase/migrations/0001_init.sql then 0002_demo_seed.sql.',
  },
  {
    title: 'Enable email OTP',
    body: 'Authentication → Providers → Email: turn on "Email OTP". Restart the dev server and sign in.',
  },
]

/** Shown wherever an account feature is used before Supabase credentials exist. */
export default function SupabaseSetupNotice() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: '3px solid var(--warning)' }}>
      <div className="p-7">
        <div className="flex items-center gap-3 mb-2">
          <Database size={20} style={{ color: 'var(--warning)' }} />
          <h2
            className="text-lg font-black uppercase"
            style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            Connect Supabase to finish setup
          </h2>
        </div>
        <p className="text-sm leading-relaxed mb-7" style={{ color: 'var(--text-muted)' }}>
          Accounts, orders, addresses and the wishlist all read from Supabase. The code is ready — it just needs
          your project credentials.
        </p>

        <ol className="space-y-px" style={{ background: 'var(--border)' }}>
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 p-4" style={{ background: 'var(--bg)' }}>
              <span
                className="flex items-center justify-center shrink-0 text-xs font-black text-white"
                style={{ width: 24, height: 24, background: 'var(--accent)', fontFamily: 'Outfit' }}
              >
                {i + 1}
              </span>
              <div>
                <p
                  className="text-sm font-bold"
                  style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}
                >
                  {s.title}
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-7 px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
          style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
        >
          Open Supabase dashboard
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  )
}
