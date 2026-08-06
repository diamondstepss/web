import 'server-only'

/**
 * Client for the AI add-on service.
 *
 * The service is ours but external: it holds the model key, the credit ledger
 * and the top-up flow, and Diamond Stepss is one of its stores. Nothing in this
 * file talks to a model directly.
 *
 * Two rules the split exists to enforce:
 *
 *  1. **`AI_SERVICE_KEY` never reaches a browser.** Only server code imports
 *     this module (`server-only` makes that a build error rather than a leak),
 *     and the admin UI goes through /api/admin/ai/*, which checks the session
 *     first. A key in client JS is a key anyone can spend.
 *
 *  2. **The service decides the price, not us.** `creditsCharged` comes back
 *     from the service; we never send it. If the caller could name its own
 *     price, someone with devtools would name zero.
 */

const BASE = process.env.AI_SERVICE_URL?.replace(/\/+$/, '')
const KEY = process.env.AI_SERVICE_KEY

/** The service dashboard, where the owner tops up. */
export const TOPUP_URL = process.env.AI_SERVICE_DASHBOARD_URL ?? null

export const isAiConfigured = Boolean(BASE && KEY)

/** Model generations are slow; a hung request must not hold a route open. */
const TIMEOUT_MS = 45_000

export class AiServiceError extends Error {
  constructor(
    message: string,
    /** What the admin UI should do about it. */
    readonly kind: 'unconfigured' | 'no-credits' | 'rate-limited' | 'unavailable' | 'rejected',
  ) {
    super(message)
  }
}

export interface DescriptionInput {
  brand: string
  title: string
  price: number
  mrp: number
  sizes: string[]
  /** Publicly reachable image URLs — the service reads the product, not guesses. */
  imageUrls?: string[]
  /** Existing copy, when the owner wants it improved rather than replaced. */
  existing?: string | null
}

export interface DescriptionResult {
  description: string
  creditsCharged: number
  creditsRemaining: number
  /** Claims the service could not verify from the photos — show these. */
  warnings?: string[]
}

export interface Pack {
  id: string
  label: string
  credits: number
  amountPaise: number
  perCreditPaise: number
}

export interface CheckoutOffer {
  configured: boolean
  credits: number
  packs: Pack[]
}

export interface CheckoutOrder {
  orderId: string
  amountPaise: number
  currency: string
  credits: number
  keyId: string
  storeName: string
}

export interface Balance {
  credits: number
  /** Below this the admin nags. The service decides what "low" means. */
  lowWater: number
}

async function call<T>(
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown; idempotencyKey?: string },
): Promise<T> {
  if (!BASE || !KEY) {
    throw new AiServiceError('The AI add-on is not connected yet.', 'unconfigured')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        authorization: `Bearer ${KEY}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        // A retry after a network wobble must not be charged twice. The service
        // returns the original result for a key it has already seen.
        ...(init.idempotencyKey ? { 'idempotency-key': init.idempotencyKey } : {}),
      },
      ...(init.body ? { body: JSON.stringify(init.body) } : {}),
    })
  } catch (e) {
    clearTimeout(timer)
    const timedOut = e instanceof Error && e.name === 'AbortError'
    throw new AiServiceError(
      timedOut ? 'The AI service took too long to answer.' : 'Could not reach the AI service.',
      'unavailable',
    )
  }
  clearTimeout(timer)

  if (res.ok) return (await res.json()) as T

  // The service's own message is the useful one — it knows why it said no.
  let detail = ''
  try {
    detail = ((await res.json()) as { error?: string }).error ?? ''
  } catch {
    /* non-JSON error body */
  }

  if (res.status === 402) {
    throw new AiServiceError(detail || 'You have run out of credits.', 'no-credits')
  }
  if (res.status === 429) {
    throw new AiServiceError(detail || 'Too many requests — try again shortly.', 'rate-limited')
  }
  if (res.status === 400 || res.status === 422) {
    throw new AiServiceError(detail || 'The AI service could not use that product.', 'rejected')
  }
  if (res.status === 401 || res.status === 403) {
    // Ours to fix, not the shop owner's — don't show them a key problem.
    console.error(`[ai-service] auth rejected on ${path}: ${detail}`)
    throw new AiServiceError('The AI add-on is not connected correctly.', 'unconfigured')
  }
  throw new AiServiceError(detail || 'The AI service is unavailable right now.', 'unavailable')
}

export function generateDescription(
  input: DescriptionInput,
  idempotencyKey: string,
): Promise<DescriptionResult> {
  return call<DescriptionResult>('/v1/generate/description', {
    method: 'POST',
    body: input,
    idempotencyKey,
  })
}

export function getBalance(): Promise<Balance> {
  return call<Balance>('/v1/balance', { method: 'GET' })
}

/** The packs on offer, priced by the service rather than by us. */
export function getPacks(): Promise<CheckoutOffer> {
  return call<CheckoutOffer>('/v1/billing/checkout', { method: 'GET' })
}

/**
 * Starts a top-up.
 *
 * Names a pack, never an amount — the price is the service's to set. A client
 * that could send its own figure could send zero.
 */
export function startCheckout(packId: string): Promise<CheckoutOrder> {
  return call<CheckoutOrder>('/v1/billing/checkout', { method: 'POST', body: { packId } })
}
