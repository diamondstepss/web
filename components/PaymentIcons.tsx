/**
 * Payment method marks.
 *
 * Card schemes require their marks to keep their own colours, so each sits on a
 * white tile rather than inheriting the theme — that is also how they stay
 * legible on the dark theme. Mastercard, Maestro and RuPay are drawn as exact
 * geometry; Visa and UPI use their wordmarks in the correct brand colours.
 *
 * COD is not a scheme, so it gets a neutral badge rather than a fake logo.
 */

const TILE: React.CSSProperties = {
  width: 46,
  height: 30,
  borderRadius: 5,
  background: '#ffffff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
  flexShrink: 0,
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span style={TILE} role="img" aria-label={label} title={label}>
      {children}
    </span>
  )
}

export function VisaMark() {
  return (
    <Tile label="Visa">
      <svg width="34" height="12" viewBox="0 0 100 34" aria-hidden focusable="false">
        <text
          x="50"
          y="26"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="28"
          fontWeight="700"
          fontStyle="italic"
          letterSpacing="1"
          fill="#1434CB"
        >
          VISA
        </text>
      </svg>
    </Tile>
  )
}

export function MastercardMark() {
  return (
    <Tile label="Mastercard">
      <svg width="34" height="21" viewBox="0 0 48 30" aria-hidden focusable="false">
        <circle cx="18" cy="15" r="14" fill="#EB001B" />
        <circle cx="30" cy="15" r="14" fill="#F79E1B" />
        {/* Overlap: the darker orange where the two circles meet */}
        <path
          d="M24 4.2A13.96 13.96 0 0 1 24 25.8 13.96 13.96 0 0 1 24 4.2Z"
          fill="#FF5F00"
        />
      </svg>
    </Tile>
  )
}

export function MaestroMark() {
  return (
    <Tile label="Maestro">
      <svg width="34" height="21" viewBox="0 0 48 30" aria-hidden focusable="false">
        <circle cx="18" cy="15" r="14" fill="#0099DF" />
        <circle cx="30" cy="15" r="14" fill="#ED0006" />
        <path d="M24 4.2A13.96 13.96 0 0 1 24 25.8 13.96 13.96 0 0 1 24 4.2Z" fill="#6C6BBD" />
      </svg>
    </Tile>
  )
}

export function RuPayMark() {
  return (
    <Tile label="RuPay">
      <svg width="36" height="13" viewBox="0 0 100 34" aria-hidden focusable="false">
        <text
          x="2"
          y="25"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="24"
          fontWeight="700"
          fontStyle="italic"
          fill="#097A3D"
        >
          Ru
        </text>
        <text
          x="40"
          y="25"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="24"
          fontWeight="700"
          fontStyle="italic"
          fill="#F26522"
        >
          Pay
        </text>
      </svg>
    </Tile>
  )
}

export function UpiMark() {
  return (
    <Tile label="UPI — Unified Payments Interface">
      <svg width="38" height="16" viewBox="0 0 110 40" aria-hidden focusable="false">
        {/* The tricolour chevrons from the UPI mark */}
        <path d="M2 4h11l-9 32H-7z" transform="translate(10,0)" fill="#097A3D" />
        <path d="M2 4h11l-9 32H-7z" transform="translate(22,0)" fill="#F26522" />
        <text
          x="44"
          y="30"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="24"
          fontWeight="700"
          fill="#0C2074"
        >
          UPI
        </text>
      </svg>
    </Tile>
  )
}

/** Cash on Delivery is not a card scheme — a neutral badge, not a fake logo. */
export function CodMark() {
  return (
    <span
      role="img"
      aria-label="Cash on Delivery"
      title="Cash on Delivery"
      style={{
        ...TILE,
        background: 'transparent',
        border: '1px solid var(--border)',
        boxShadow: 'none',
        width: 'auto',
        paddingInline: 8,
        gap: 5,
        color: 'var(--text-muted)',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.06em' }}>COD</span>
    </span>
  )
}

export const PAYMENT_MARKS = [UpiMark, VisaMark, MastercardMark, MaestroMark, RuPayMark, CodMark]
