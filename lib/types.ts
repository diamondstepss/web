export interface Product {
  id: string
  brand: string
  title: string
  price: number
  mrp: number
  discount: number
  image: string
  badge?: 'NEW' | 'SOLD OUT' | null
  sizes?: number[]
  isNew?: boolean
  /** Units on hand. Drives the "in stock only" filter. */
  stock?: number
  /** Units on hand per size — present only on the single-product page, which
   *  is the only place that needs to know which specific sizes are sold out
   *  rather than just whether the product as a whole is. */
  sizeStock?: Record<number, number>
  /** Category slugs this product belongs to, for category filtering. */
  categories?: string[]
}

export type OrderStatus =
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export type PaymentMode = 'PREPAID' | 'COD' | 'PARTIAL_COD'

export type FulfillmentType = 'DELIVERY' | 'PICKUP'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  created_at: string
}

export interface Address {
  id: string
  user_id: string
  label: string
  name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  is_default: boolean
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  brand: string
  title: string
  size: string | null
  qty: number
  price: number
  image: string | null
}

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  payment_mode: PaymentMode
  payment_status: string
  fulfillment_type: FulfillmentType
  subtotal: number
  discount: number
  shipping_fee: number
  cod_fee: number
  total: number
  amount_paid_online: number
  amount_due_on_delivery: number
  courier: string | null
  awb: string | null
  placed_at: string
  order_items: OrderItem[]
  /** A delivery address for DELIVERY orders, or just {name, phone} for PICKUP. */
  shipping_address: {
    name: string
    phone: string
    line1?: string
    line2?: string | null
    city?: string
    state?: string
    pincode?: string
  } | null
}

/** Order of the fulfilment timeline, used to derive progress from `status`. */
export const ORDER_STEPS: OrderStatus[] = [
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

// Pickup skips the shipped/out-for-delivery leg entirely — there's no
// courier in that path, just "ready" and "picked up."
export const ORDER_STEPS_PICKUP: OrderStatus[] = ['CONFIRMED', 'PACKED', 'DELIVERED']

export const STEP_LABELS: Record<string, string> = {
  CONFIRMED: 'Ordered',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
}

export const STEP_LABELS_PICKUP: Record<string, string> = {
  CONFIRMED: 'Ordered',
  PACKED: 'Ready for pickup',
  DELIVERED: 'Picked up',
}

export const PAYMENT_LABELS: Record<PaymentMode, string> = {
  PREPAID: 'Paid online',
  COD: 'Cash on Delivery',
  PARTIAL_COD: 'Partial COD',
}

/** How many timeline steps are complete. Cancelled orders have no progress. */
export function orderProgress(status: OrderStatus, fulfillmentType: FulfillmentType = 'DELIVERY'): number {
  if (status === 'CANCELLED') return 0
  const steps = fulfillmentType === 'PICKUP' ? ORDER_STEPS_PICKUP : ORDER_STEPS
  return steps.indexOf(status) + 1
}
