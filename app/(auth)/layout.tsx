/**
 * Bare shell for auth screens — no announcement bar, header, footer or
 * breadcrumbs. A focused, full-viewport page with nothing to click away to.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main style={{ minHeight: '100dvh' }}>{children}</main>
}
