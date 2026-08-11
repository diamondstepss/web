import 'server-only'

/**
 * Instamojo Payment Requests API (classic v1.1, header-key auth).
 *
 * This returns a hosted page URL, not an embedded SDK session. The client
 * opens it in Instamojo's checkout.js modal (falling back to a full-page
 * redirect if that script didn't load), and Instamojo redirects to
 * `redirectUrl` afterward either way. Confirmation still comes from the
 * webhook, never from this call succeeding or from the redirect happening.
 */

function baseUrl() {
  return process.env.INSTAMOJO_ENV === 'production'
    ? 'https://www.instamojo.com/api/1.1'
    : 'https://test.instamojo.com/api/1.1'
}

export const isInstamojoConfigured = Boolean(
  process.env.INSTAMOJO_API_KEY && process.env.INSTAMOJO_AUTH_TOKEN && process.env.INSTAMOJO_SALT,
)

export interface CreatePaymentRequestInput {
  orderNumber: string
  amount: number
  customer: { name: string; email: string; phone: string }
  redirectUrl: string
}

export interface InstamojoPaymentRequest {
  paymentRequestId: string
  longurl: string
}

export async function createPaymentRequest(
  input: CreatePaymentRequestInput,
): Promise<InstamojoPaymentRequest | null> {
  if (!isInstamojoConfigured) {
    console.warn('[instamojo] credentials not set — skipping payment request')
    return null
  }

  const body = new URLSearchParams({
    purpose: `Order ${input.orderNumber}`,
    // Instamojo takes whole rupees only, min 9, max 200000.
    amount: String(Math.round(input.amount)),
    buyer_name: input.customer.name || 'Customer',
    email: input.customer.email,
    phone: input.customer.phone.replace(/[^\d]/g, '').slice(-10) || '9999999999',
    redirect_url: input.redirectUrl,
    webhook: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/webhooks/instamojo`,
    allow_repeated_payments: 'false',
  })

  const res = await fetch(`${baseUrl()}/payment-requests/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Api-Key': process.env.INSTAMOJO_API_KEY!,
      'X-Auth-Token': process.env.INSTAMOJO_AUTH_TOKEN!,
    },
    body,
  })

  const data = (await res.json()) as {
    success?: boolean
    // Instamojo returns a plain string for account-level errors, but a
    // { field: [errors] } map for per-field validation failures (e.g. phone).
    message?: string | Record<string, string[]>
    payment_request?: { id?: string; longurl?: string }
  }

  if (!res.ok || !data.success || !data.payment_request?.longurl || !data.payment_request?.id) {
    console.error('[instamojo] payment request create failed', res.status, data)
    const message =
      typeof data.message === 'string'
        ? data.message
        : data.message
          ? Object.entries(data.message).map(([field, errs]) => `${field}: ${errs.join(', ')}`).join('; ')
          : 'Could not start the payment.'
    throw new Error(message)
  }

  return {
    paymentRequestId: data.payment_request.id,
    longurl: data.payment_request.longurl,
  }
}
