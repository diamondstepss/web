'use client'

import { useState, useEffect, useCallback } from 'react'

type Theme = 'dark' | 'light'

/**
 * Reads whatever the pre-paint script in the root layout already applied, so
 * the first client render agrees with the DOM and nothing flashes. Writes the
 * choice back to localStorage on change.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme')
    setTheme(current === 'light' ? 'light' : 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      try {
        localStorage.setItem('ds-theme', next)
      } catch {
        /* private mode — theme just won't persist */
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
