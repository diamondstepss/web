/**
 * Admin shell. No announcement bar, storefront nav or marketing footer — the
 * panel brings its own sidebar and topbar, and shop chrome around it looked
 * like a plugin bolted onto a theme.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>{children}</div>
}
