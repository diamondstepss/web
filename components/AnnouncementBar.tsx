'use client'

import { DEFAULT_SETTINGS } from '@/lib/settings'

export default function AnnouncementBar({
  freeShippingOver = DEFAULT_SETTINGS.freeShippingOver,
}: {
  freeShippingOver?: number
}) {
  const text =
    // Repeated so the marquee has enough width to scroll seamlessly.
    Array(3)
      .fill(
        `FREE SHIPPING OVER ₹${freeShippingOver.toLocaleString('en-IN')} · COD AVAILABLE · 7-DAY EASY RETURNS · `,
      )
      .join('')

  return (
    <div
      className="overflow-hidden py-2 text-xs font-medium tracking-widest text-white"
      style={{ background: 'var(--accent)' }}
    >
      <div className="marquee-track">
        <span className="pr-8">{text}</span>
        <span className="pr-8">{text}</span>
      </div>
    </div>
  )
}
