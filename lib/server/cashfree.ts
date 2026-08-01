import 'server-only'

/**
 * Cashfree Payment Gateway — Orders API.
 *
 * Creates a payment session the browser hands to the Cashfree SDK. Credentials
 * live only here; nothing about them reaches the client. Confirmation comes
 * from the webhook, never from this call succeeding.
 */

const API_VERSION = '2023-08-01'

function baseUrl() {
  return process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'
}

export const isCashfreeConfigured = Boolean(
  process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY,
)

export interface CreateSessionInput {
  orderNumber: string
  amount: number
  customer: { id: string; name: string; email: string; phone: string }
  returnUrl: string
}

export interface CashfreeSession {
  paymentSessionId: string
  cfOrderId: string
}

export async function createPaymentSession(
  input: CreateSessionInput,
): Promise<CashfreeSession | null> {
  if (!isCashfreeConfigured) {
    console.warn('[cashfree] credentials not set — skipping payment session')
    return null
  }

  const res = await fetch(`${baseUrl()}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': API_VERSION,
      'x-client-id': process.env.CASHFREE_APP_ID!,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
    },
    body: JSON.stringify({
      order_id: input.orderNumber,
      order_amount: Number(input.amount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: input.customer.id,
        customer_name: input.customer.name || 'Customer',
        customer_email: input.customer.email,
        // Cashfree rejects anything that isn't 10 digits or +91-prefixed.
        customer_phone: input.customer.phone.replace(/[^\d]/g, '').slice(-10) || '9999999999',
      },
      order_meta: { return_url: input.returnUrl },
    }),
  })

  const body = (await res.json()) as {
    payment_session_id?: string
    cf_order_id?: string | number
    message?: string
  }

  if (!res.ok || !body.payment_session_id) {
    console.error('[cashfree] order create failed', res.status, body)
    throw new Error(body.message ?? 'Could not start the payment.')
  }

  return {
    paymentSessionId: body.payment_session_id,
    cfOrderId: String(body.cf_order_id ?? ''),
  }
}
