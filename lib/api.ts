import { db } from '@/lib/supabase/client'
import type { Address, Order, Profile } from '@/lib/types'

// ─── ORDERS ──────────────────────────────────────────────────────────────────

/** Orders for the signed-in user, newest first, with their line items. */
export async function fetchOrders(userId: string): Promise<Order[]> {
  const { data, error } = await db()
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Order[]
}

export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await db().from('orders').update({ status: 'CANCELLED' }).eq('id', orderId)
  if (error) throw error
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'full_name' | 'phone'>>,
): Promise<Profile> {
  const { data, error } = await db()
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

// ─── ADDRESSES ───────────────────────────────────────────────────────────────

export async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await db()
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Address[]
}

export type AddressInput = Omit<Address, 'id' | 'user_id' | 'created_at'>

export async function createAddress(userId: string, input: AddressInput): Promise<Address> {
  const { data, error } = await db()
    .from('addresses')
    .insert({ ...input, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as Address
}

export async function updateAddress(id: string, patch: Partial<AddressInput>): Promise<Address> {
  const { data, error } = await db().from('addresses').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Address
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await db().from('addresses').delete().eq('id', id)
  if (error) throw error
}

/** The DB trigger clears the previous default, so this only sets the new one. */
export async function setDefaultAddress(id: string): Promise<void> {
  const { error } = await db().from('addresses').update({ is_default: true }).eq('id', id)
  if (error) throw error
}

// ─── WISHLIST ────────────────────────────────────────────────────────────────

export async function fetchWishlist(userId: string): Promise<string[]> {
  const { data, error } = await db()
    .from('wishlist')
    .select('product_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r: { product_id: string }) => r.product_id)
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  const { error } = await db()
    .from('wishlist')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' })
  if (error) throw error
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  const { error } = await db()
    .from('wishlist')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) throw error
}

export async function clearWishlist(userId: string): Promise<void> {
  const { error } = await db().from('wishlist').delete().eq('user_id', userId)
  if (error) throw error
}
