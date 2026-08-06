'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useTheme } from '@/lib/useTheme'
import { fetchWishlist } from '@/lib/api'
import {
  Search,
  Sun,
  Moon,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react'

interface HeaderProps {
  cartCount?: number
}

const NAV_ITEMS = [
  { label: 'NEW ARRIVALS', href: '/product-category/new-arrivals' },
  { label: 'SNEAKERS', href: '/product-category/sneakers', hasDropdown: true },
  { label: 'SPORTS', href: '/product-category/sports-shoes' },
  { label: 'FORMAL', href: '/product-category/leather-shoes' },
  { label: 'SLIPPERS', href: '/product-category/slippers' },
  { label: 'ACCESSORIES', href: '/product-category/accessories' },
  { label: 'SALE', href: '/product-category/sale', accent: true },
]

/**
 * Which nav item the current URL belongs to.
 *
 * startsWith covers the sub-category pages — /product-category/sneakers/low-top
 * keeps SNEAKERS lit — and the trailing slash stops /sports-shoes-sale from
 * matching /sports-shoes.
 */
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

const BRANDS = [
  'Nike',
  'Adidas',
  'Jordan',
  'Puma',
  'Converse',
  'Vans',
  'Crocs',
  'ASICS',
  'New Balance',
  'Onitsuka Tiger',
  'Amiri',
  'Balenciaga',
  'BAPE',
  'Louis Vuitton',
]

const SNEAKER_CATS = [
  'Low-Top Sneakers',
  'High-Top Sneakers',
  'Chunky Sneakers',
  'Retro / Vintage',
  'Collab Drops',
  'Limited Edition',
]

export default function Header({}: HeaderProps) {
  const { count: cartCount, hydrated: cartHydrated } = useCart()
  const { theme, toggleTheme: onToggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  // Real wishlist count for the badge — null while unknown or signed out.
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return setCount(null)
    let alive = true
    fetchWishlist(user.id)
      .then((ids) => alive && setCount(ids.length))
      .catch(() => alive && setCount(null))
    return () => {
      alive = false
    }
  }, [user])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`)
      setSearchOpen(false)
      setSearchVal('')
    }
  }

  return (
    <>
      <header
        className="sticky top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? 'var(--nav-bg)' : 'var(--nav-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid var(--border)`,
        }}
      >
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-6 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0" aria-label="Diamond Stepss — home">
            <img
              src="/brand/wide-logo.png"
              alt="Diamond Stepss"
              width={160}
              height={78}
              className="h-10 w-auto"
              /* The wordmark's "Stepss" script is black, so it disappears on the dark
                 theme. Until the light-on-dark export exists (PLAN.md §0), invert it
                 there — the red reads close enough and the mark stays legible. */
              style={{ filter: theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none' }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href)
              return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.hasDropdown && setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className="relative flex items-center gap-1 px-3 py-2 text-xs tracking-widest uppercase transition-colors duration-200"
                  style={{
                    color: item.accent || active ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: active ? 800 : 600,
                    fontFamily: 'Outfit',
                  }}
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown size={12} />}
                  {/* Underline sits just inside the padding so it tracks the
                      label rather than the whole hit area. */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-3 right-3 -bottom-0.5"
                      style={{ height: 2, background: 'var(--accent)' }}
                    />
                  )}
                </Link>

                {/* Mega dropdown */}
                {item.hasDropdown && megaOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] p-6 grid grid-cols-4 gap-6 z-50"
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid var(--border)`,
                      marginTop: 1,
                    }}
                  >
                    <div>
                      <div
                        className="text-xs font-bold tracking-widest uppercase mb-3"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Categories
                      </div>
                      {SNEAKER_CATS.map((cat) => (
                        <Link
                          key={cat}
                          href={`/product-category/sneakers/${cat.toLowerCase().replace(/\s+/g, '-')}`}
                          className="block py-1.5 text-sm transition-colors duration-200"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={(e) =>
                            ((e.target as HTMLElement).style.color = 'var(--accent)')
                          }
                          onMouseLeave={(e) =>
                            ((e.target as HTMLElement).style.color = 'var(--text-primary)')
                          }
                        >
                          {cat}
                        </Link>
                      ))}
                    </div>
                    <div>
                      <div
                        className="text-xs font-bold tracking-widest uppercase mb-3"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Brands
                      </div>
                      {BRANDS.slice(0, 7).map((b) => (
                        <Link
                          key={b}
                          href={`/product-category/sneakers?brand=${b}`}
                          className="block py-1.5 text-sm transition-colors duration-200"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={(e) =>
                            ((e.target as HTMLElement).style.color = 'var(--accent)')
                          }
                          onMouseLeave={(e) =>
                            ((e.target as HTMLElement).style.color = 'var(--text-primary)')
                          }
                        >
                          {b}
                        </Link>
                      ))}
                    </div>
                    <div>
                      <div
                        className="text-xs font-bold tracking-widest uppercase mb-3"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        &nbsp;
                      </div>
                      {BRANDS.slice(7).map((b) => (
                        <Link
                          key={b}
                          href={`/product-category/sneakers?brand=${b}`}
                          className="block py-1.5 text-sm transition-colors duration-200"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={(e) =>
                            ((e.target as HTMLElement).style.color = 'var(--accent)')
                          }
                          onMouseLeave={(e) =>
                            ((e.target as HTMLElement).style.color = 'var(--text-primary)')
                          }
                        >
                          {b}
                        </Link>
                      ))}
                    </div>
                    <div
                      className="rounded overflow-hidden relative"
                      style={{ background: 'var(--accent)' }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=240&h=320&fit=crop&auto=format"
                        alt="Sneaker promo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80">
                        <div
                          className="text-xs font-bold tracking-widest uppercase text-white"
                          style={{ fontFamily: 'Outfit' }}
                        >
                          NEW DROP
                        </div>
                        <div className="text-lg font-black text-white uppercase" style={{ fontFamily: 'Outfit' }}>
                          SUMMER '25
                        </div>
                        <Link
                          href="/product-category/sneakers"
                          className="mt-2 text-xs font-bold uppercase text-white underline"
                        >
                          Shop Now →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )
            })}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="h-11 w-11 flex items-center justify-center rounded transition-colors duration-200"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <button
              onClick={onToggleTheme}
              className="h-11 w-11 flex items-center justify-center rounded transition-colors duration-200"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              href={user ? '/my-account' : '/login'}
              className="relative h-11 w-11 hidden sm:flex items-center justify-center rounded transition-colors duration-200"
              style={{ color: 'var(--text-primary)' }}
              aria-label={user ? 'My account' : 'Sign in'}
            >
              <User size={18} />
              {user && (
                <span
                  aria-hidden
                  className="absolute bottom-1 right-1 rounded-full"
                  style={{ width: 7, height: 7, background: 'var(--success)', border: '1.5px solid var(--nav-bg)' }}
                />
              )}
            </Link>
            <Link
              href={user ? '/wishlist' : '/login'}
              className="relative h-11 w-11 flex items-center justify-center rounded transition-colors duration-200"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Wishlist"
            >
              <Heart size={18} />
              {count !== null && count > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-white text-[10px] font-bold rounded-full"
                  style={{ background: 'var(--accent)' }}
                >
                  {count}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              className="relative h-11 w-11 flex items-center justify-center rounded transition-colors duration-200"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {cartHydrated && cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-white text-[10px] font-bold rounded-full"
                  style={{ background: 'var(--accent)' }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden h-11 w-11 flex items-center justify-center rounded"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div
            className="border-t"
            style={{ borderColor: 'var(--border)', background: 'var(--nav-bg)' }}
          >
            <form onSubmit={handleSearch} className="mx-auto max-w-[1440px] px-6 py-3 flex gap-3">
              <input
                autoFocus
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search sneakers, brands, categories..."
                className="flex-1 px-4 py-2 text-sm outline-none"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: `1px solid var(--border)`,
                  borderRadius: 'var(--radius-btn)',
                }}
              />
              <button
                type="submit"
                className="px-5 py-2 text-sm font-bold text-white uppercase tracking-wider"
                style={{ background: 'var(--accent)', borderRadius: 'var(--radius-btn)' }}
              >
                Search
              </button>
              <button type="button" onClick={() => setSearchOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="w-80 h-full overflow-y-auto slide-in flex flex-col"
            style={{ background: 'var(--surface)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 flex items-center justify-center rounded"
                  style={{ background: 'var(--accent)' }}
                >
                  <span className="text-white text-base">👟</span>
                </div>
                <div>
                  <div
                    className="font-black text-xs tracking-widest uppercase"
                    style={{ fontFamily: 'Outfit', color: 'var(--text-primary)' }}
                  >
                    DIAMOND
                  </div>
                  <div className="text-xs italic" style={{ color: 'var(--accent)' }}>
                    Stepss
                  </div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-5 py-4 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center gap-2.5 py-3 text-sm font-bold tracking-widest uppercase border-b"
                    style={{
                      color: item.accent || active ? 'var(--accent)' : 'var(--text-primary)',
                      borderColor: 'var(--border)',
                      fontFamily: 'Outfit',
                    }}
                  >
                    {/* A bar rather than an underline: in a stacked list the
                        eye picks up the left edge faster. */}
                    <span
                      aria-hidden
                      style={{
                        width: 3,
                        height: 16,
                        borderRadius: 2,
                        background: active ? 'var(--accent)' : 'transparent',
                      }}
                    />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div
              className="px-5 py-4 border-t flex gap-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <Link
                href={user ? '/my-account' : '/login'}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                <User size={16} /> Account
              </Link>
              <Link
                href={user ? '/wishlist' : '/login'}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                <Heart size={16} /> Wishlist{count !== null ? ` (${count})` : ''}
              </Link>
            </div>
          </div>
          <div
            className="flex-1"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  )
}
