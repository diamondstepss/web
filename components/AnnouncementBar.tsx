'use client'

export default function AnnouncementBar() {
  const text =
    'FREE SHIPPING OVER ₹999 · COD AVAILABLE · 7-DAY EASY RETURNS · FREE SHIPPING OVER ₹999 · COD AVAILABLE · 7-DAY EASY RETURNS · FREE SHIPPING OVER ₹999 · COD AVAILABLE · 7-DAY EASY RETURNS · '

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
