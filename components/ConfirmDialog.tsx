'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'

/**
 * Promise-based confirmation dialog.
 *
 *   const confirm = useConfirm()
 *   if (await confirm({ title: 'Delete product?', message: '…' })) { … }
 *
 * Replaces window.confirm, which can't be styled, is blocked by some browsers
 * in async contexts, and looks nothing like the rest of the site.
 *
 * The provider is mounted at the root, above the admin's `.adm` scope, so the
 * admin design tokens aren't in scope by default. Rather than ship one dialog
 * that looks foreign in one of the two places, it reads the route and adopts
 * whichever token set it's sitting in — see SKIN below.
 */

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button — for anything that destroys data. Defaults to true. */
  destructive?: boolean
}

type Resolver = (ok: boolean) => void

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | undefined>(
  undefined,
)

/**
 * The two contexts differ in more than colour: the storefront speaks in pill
 * buttons and generous radii, the admin in tighter, squarer geometry.
 */
const SKIN = {
  shop: {
    surface: 'var(--surface)',
    line: 'var(--border)',
    text: 'var(--text-primary)',
    muted: 'var(--text-muted)',
    danger: 'var(--danger)',
    dangerFill: 'var(--danger)',
    accent: 'var(--accent)',
    inset: 'var(--hover)',
    radius: 20,
    btnRadius: 99,
    sheen: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  admin: {
    surface: 'var(--adm-panel)',
    line: 'var(--adm-line)',
    text: 'var(--adm-text)',
    muted: 'var(--adm-text-2)',
    danger: 'var(--adm-bad)',
    dangerFill: 'var(--adm-bad-fill)',
    accent: 'var(--adm-accent)',
    inset: 'var(--adm-inset)',
    radius: 14,
    btnRadius: 9,
    sheen: 'var(--adm-sheen)',
  },
} as const

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<Resolver | null>(null)
  const confirmBtn = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const pathname = usePathname()

  const isAdmin = pathname?.startsWith('/admin') ?? false
  const s = isAdmin ? SKIN.admin : SKIN.shop

  const confirm = useCallback((o: ConfirmOptions) => {
    previouslyFocused.current = document.activeElement as HTMLElement
    setOptions(o)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const close = useCallback((ok: boolean) => {
    resolver.current?.(ok)
    resolver.current = null
    setOptions(null)
    // Send focus back where it came from, so keyboard users aren't dumped at
    // the top of the document.
    previouslyFocused.current?.focus?.()
  }, [])

  // Escape to cancel, and keep focus inside the dialog while it's open.
  useEffect(() => {
    if (!options) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(false)
      }
      if (e.key === 'Tab') {
        const focusable = document.querySelectorAll<HTMLElement>('[data-confirm-focusable]')
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => confirmBtn.current?.focus(), 40)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
      document.body.style.overflow = prevOverflow
    }
  }, [options, close])

  const destructive = options?.destructive !== false
  /** Icon tint — needs contrast against the panel, so it uses the text-safe red. */
  const tone = destructive ? s.danger : s.accent
  /** Button fill — needs saturation, so it uses the dedicated fill red. */
  const fill = destructive ? s.dangerFill : s.accent

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {options && (
        <div
          // `adm` puts the admin custom properties in scope when we're inside
          // the panel; the inline background below still wins over the class.
          className={`confirm-backdrop fixed inset-0 z-[100] flex items-center justify-center px-5 ${isAdmin ? 'adm' : ''}`}
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
          onMouseDown={(e) => {
            // Backdrop click cancels; clicks inside the panel must not.
            if (e.target === e.currentTarget) close(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={options.message ? 'confirm-message' : undefined}
            className="w-full confirm-pop"
            style={{
              maxWidth: 400,
              background: s.surface,
              border: `1px solid ${s.line}`,
              borderRadius: s.radius,
              boxShadow: `0 1px 2px rgba(0,0,0,0.3), 0 32px 64px -24px rgba(0,0,0,0.65), ${s.sheen}`,
            }}
          >
            <div className="p-5">
              <div className="flex items-start gap-3.5">
                <span
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: s.btnRadius === 99 ? 99 : 11,
                    background: `color-mix(in srgb, ${tone} 13%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${tone} 26%, transparent)`,
                    color: tone,
                  }}
                >
                  <AlertTriangle size={17} />
                </span>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h2
                    id="confirm-title"
                    className="text-[15px]"
                    style={{
                      fontFamily: 'var(--font-outfit), Outfit, sans-serif',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      color: s.text,
                    }}
                  >
                    {options.title}
                  </h2>
                  {options.message && (
                    <p
                      id="confirm-message"
                      className="mt-1.5 text-[12.5px] leading-relaxed"
                      style={{ color: s.muted }}
                    >
                      {options.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  data-confirm-focusable
                  onClick={() => close(false)}
                  aria-label="Close"
                  className="shrink-0 flex items-center justify-center transition-colors"
                  style={{ width: 26, height: 26, borderRadius: 7, color: s.muted }}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-5">
                {/* Esc is the fastest way out; say so rather than hide it. */}
                <span className="hidden sm:flex items-center gap-1.5 text-[10.5px] mr-auto" style={{ color: s.muted }}>
                  <kbd
                    className="px-1.5 py-0.5 font-mono text-[9.5px]"
                    style={{ background: s.inset, border: `1px solid ${s.line}`, borderRadius: 5, color: s.muted }}
                  >
                    Esc
                  </kbd>
                  to cancel
                </span>

                <button
                  type="button"
                  data-confirm-focusable
                  onClick={() => close(false)}
                  className="confirm-btn"
                  style={{
                    border: `1px solid ${s.line}`,
                    color: s.text,
                    borderRadius: s.btnRadius,
                    background: 'transparent',
                  }}
                >
                  {options.cancelLabel ?? 'Cancel'}
                </button>

                <button
                  type="button"
                  ref={confirmBtn}
                  data-confirm-focusable
                  onClick={() => close(true)}
                  className="confirm-btn text-white"
                  style={{
                    // Only a touch of white at the top — enough to read as a lit
                    // surface without desaturating the red into pink.
                    background: `linear-gradient(180deg, color-mix(in srgb, ${fill} 93%, white), ${fill})`,
                    borderRadius: s.btnRadius,
                    boxShadow: `0 1px 2px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.22)`,
                  }}
                >
                  {options.confirmLabel ?? 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx
}
