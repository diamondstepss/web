'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/useTheme'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  Package,
  Tag,
  FolderOpen,
  Layers,
  Image as ImageIcon,
  ShoppingBag,
  Users,
  Percent,
  Truck,
  BarChart2,
  Settings,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  ExternalLink,
  LogOut,
} from 'lucide-react'

/**
 * Admin chrome — sidebar, breadcrumb, mobile drawer.
 *
 * Lives in a layout so it mounts once and survives navigation: React keeps the
 * sidebar in place and only swaps the panel below it.
 *
 * Nav is grouped rather than a flat list of twelve. Twelve undifferentiated
 * rows is a menu you have to read every time; three groups of four is one you
 * learn the shape of.
 */

interface NavItem {
  label: string
  icon: React.ComponentType<{ size?: number | string; className?: string }>
  href: string
}

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/admin' }],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', icon: Package, href: '/admin/products' },
      { label: 'Categories', icon: Tag, href: '/admin/categories' },
      { label: 'Collections', icon: FolderOpen, href: '/admin/collections' },
      { label: 'Media', icon: ImageIcon, href: '/admin/media' },
    ],
  },
  {
    label: 'Selling',
    items: [
      { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
      { label: 'Customers', icon: Users, href: '/admin/customers' },
      { label: 'Coupons', icon: Percent, href: '/admin/coupons' },
      { label: 'Reports', icon: BarChart2, href: '/admin/reports' },
    ],
  },
  {
    label: 'Storefront',
    items: [
      { label: 'Sections', icon: Layers, href: '/admin/sections' },
      { label: 'Shipping', icon: Truck, href: '/admin/shipping' },
      { label: 'Settings', icon: Settings, href: '/admin/settings' },
    ],
  },
]

export const ADMIN_NAV = NAV_GROUPS.flatMap((g) => g.items)

/** Longest matching href wins, so /admin/products/new keeps Products lit. */
function activeItem(pathname: string) {
  return [...ADMIN_NAV]
    .filter((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const current = activeItem(pathname)

  // Route change closes the drawer — otherwise it stays open over the new page.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const initial = (user?.email ?? 'A').charAt(0).toUpperCase()

  const sidebarInner = (
    <>
      <div className="px-4 h-14 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--adm-line)' }}>
        <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
          <span
            className="flex items-center justify-center shrink-0 adm-display text-[13px] text-white"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(155deg, var(--adm-accent), color-mix(in srgb, var(--adm-accent) 62%, #000))',
              boxShadow: '0 2px 8px -2px var(--adm-accent-line), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            DS
          </span>
          <span className="min-w-0">
            <span className="block adm-display text-[12.5px] leading-tight truncate" style={{ color: 'var(--adm-text)' }}>
              Diamond Stepss
            </span>
            <span className="block text-[10px] leading-tight" style={{ color: 'var(--adm-text-3)' }}>
              Admin
            </span>
          </span>
        </Link>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="adm-icon-btn lg:hidden">
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label ?? gi} className={gi > 0 ? 'mt-5' : ''}>
            {group.label && <p className="adm-eyebrow px-5 mb-1.5">{group.label}</p>}
            {group.items.map(({ label, icon: Icon, href }) => (
              <Link
                key={href}
                href={href}
                aria-current={current?.href === href ? 'page' : undefined}
                className="adm-nav-item"
              >
                <Icon size={15} className="adm-nav-icon shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-2.5 shrink-0" style={{ borderTop: '1px solid var(--adm-line)' }}>
        <div
          className="flex items-center gap-2.5 px-2.5 py-2"
          style={{ borderRadius: 'var(--adm-r-sm)', background: 'var(--adm-panel)' }}
        >
          <span
            className="flex items-center justify-center shrink-0 adm-display text-[11px] text-white"
            style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--adm-accent)' }}
          >
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium truncate" style={{ color: 'var(--adm-text)' }}>
              {user?.email ?? 'Signed in'}
            </span>
            <span className="block text-[10px]" style={{ color: 'var(--adm-text-3)' }}>Administrator</span>
          </span>
          <button type="button" onClick={() => void signOut()} className="adm-icon-btn shrink-0" aria-label="Sign out" title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="adm flex h-[100dvh]">
      <aside
        className="w-[228px] shrink-0 flex-col hidden lg:flex"
        style={{ background: 'var(--adm-sidebar)', borderRight: '1px solid var(--adm-line)' }}
      >
        {sidebarInner}
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        >
          <aside
            className="w-[228px] h-full flex flex-col slide-in"
            style={{ background: 'var(--adm-sidebar)', borderRight: '1px solid var(--adm-line)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarInner}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header
          className="h-14 flex items-center justify-between px-3 lg:px-6 shrink-0 gap-3"
          style={{
            borderBottom: '1px solid var(--adm-line)',
            background: 'color-mix(in srgb, var(--adm-bg) 82%, transparent)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-2 text-[12.5px] min-w-0">
            <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="adm-icon-btn lg:hidden">
              <Menu size={17} />
            </button>
            <Link href="/admin" className="hidden sm:inline transition-colors" style={{ color: 'var(--adm-text-3)' }}>
              Admin
            </Link>
            <ChevronRight size={13} className="hidden sm:inline shrink-0" style={{ color: 'var(--adm-text-3)' }} />
            <span className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>
              {current?.label ?? 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={toggleTheme} className="adm-icon-btn" aria-label="Toggle theme" title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="adm-btn adm-btn-ghost"
              style={{ height: 30, padding: '0 11px' }}
            >
              <ExternalLink size={12} />
              <span className="hidden sm:inline">Storefront</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 lg:py-6">{children}</main>
      </div>
    </div>
  )
}
