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
}

/** Order of the fulfilment timeline, used to derive progress from `status`. */
export const ORDER_STEPS: OrderStatus[] = [
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]

export const STEP_LABELS: Record<string, string> = {
  CONFIRMED: 'Ordered',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
}

export const PAYMENT_LABELS: Record<PaymentMode, string> = {
  PREPAID: 'Paid online',
  COD: 'Cash on Delivery',
  PARTIAL_COD: 'Partial COD',
}

/** How many timeline steps are complete. Cancelled orders have no progress. */
export function orderProgress(status: OrderStatus): number {
  if (status === 'CANCELLED') return 0
  return ORDER_STEPS.indexOf(status) + 1
}
