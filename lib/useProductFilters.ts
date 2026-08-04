'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { Product } from './types'
import {
  applyFilters,
  deriveFacets,
  filtersFromParams,
  filtersToParams,
  activeCount,
  EMPTY_FILTERS,
  type Filters,
} from './filters'

/**
 * Filter state for a product listing, mirrored into the query string.
 *
 * Keeping it in the URL means a filtered view can be shared, bookmarked and
 * reached with the back button — and it survives a reload, which matters here
 * because the admin panel had exactly that complaint about its own tabs.
 *
 * The URL is the source of truth; `replace` (not `push`) keeps a long filtering
 * session from burying the previous page under dozens of history entries.
 */
export function useProductFilters(products: Product[]) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Seed from the URL so a shared link opens already filtered.
  const [filters, setFilters] = useState<Filters>(() =>
    filtersFromParams(new URLSearchParams(searchParams.toString())),
  )

  // Back/forward should move through filter states, so re-read on URL change.
  useEffect(() => {
    setFilters(filtersFromParams(new URLSearchParams(searchParams.toString())))
  }, [searchParams])

  const update = useCallback(
    (next: Filters) => {
      setFilters(next)
      const q = filtersToParams(next)
      // Preserve params this hook doesn't own, e.g. the search query `q`.
      const existing = new URLSearchParams(searchParams.toString())
      for (const k of ['q']) {
        const v = existing.get(k)
        if (v) q.set(k, v)
      }
      const qs = q.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const clear = useCallback(() => update({ ...EMPTY_FILTERS, sort: filters.sort }), [update, filters.sort])

  // Facets come from the unfiltered set, so options never vanish mid-session.
  const facets = useMemo(() => deriveFacets(products), [products])
  const results = useMemo(() => applyFilters(products, filters), [products, filters])

  return {
    filters,
    setFilters: update,
    clear,
    facets,
    results,
    activeCount: activeCount(filters),
  }
}
