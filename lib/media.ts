'use client'

import { db } from './supabase/client'

/**
 * Product gallery — up to 5 images per product.
 *
 * Files go to the public `product-images` bucket; the row in product_media is
 * what orders them. The 5-image cap is enforced by a database trigger too, so
 * a second admin tab cannot slip past it.
 */

export const MAX_IMAGES = 5
const BUCKET = 'product-images'

export interface GalleryImage {
  id: string
  product_id: string
  url: string
  alt: string | null
  position: number
  type: string
}

export async function fetchGallery(productId: string): Promise<GalleryImage[]> {
  const { data, error } = await db()
    .from('product_media')
    .select('*')
    .eq('product_id', productId)
    .order('position')
  if (error) throw error
  return (data ?? []) as GalleryImage[]
}

export class UploadError extends Error {}

/** Validates, uploads to storage, then records the row. Returns the new image. */
export async function uploadImage(
  productId: string,
  file: File,
  position: number,
): Promise<GalleryImage> {
  if (!file.type.startsWith('image/')) {
    throw new UploadError(`${file.name} is not an image.`)
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new UploadError(`${file.name} is over 5 MB. Please compress it first.`)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  // Unique key per upload so replacing an image never hits a browser cache.
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: upErr } = await db().storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  })
  if (upErr) throw new UploadError(upErr.message)

  const {
    data: { publicUrl },
  } = db().storage.from(BUCKET).getPublicUrl(path)

  const { data, error } = await db()
    .from('product_media')
    .insert({ product_id: productId, type: 'IMAGE', url: publicUrl, position })
    .select()
    .single()

  if (error) {
    // Don't leave an orphaned file behind if the row fails.
    await db().storage.from(BUCKET).remove([path])
    throw new UploadError(error.message)
  }

  return data as GalleryImage
}

export async function deleteImage(image: GalleryImage): Promise<void> {
  const { error } = await db().from('product_media').delete().eq('id', image.id)
  if (error) throw error

  // Only remove the file if it is ours — seeded rows point at Unsplash.
  const marker = `/${BUCKET}/`
  if (image.url.includes(marker)) {
    const path = image.url.split(marker)[1]
    if (path) await db().storage.from(BUCKET).remove([decodeURIComponent(path)])
  }
}

/** Persists a reordered gallery; index 0 becomes the product's main image. */
export async function reorderGallery(images: GalleryImage[]): Promise<void> {
  await Promise.all(
    images.map((img, i) => db().from('product_media').update({ position: i }).eq('id', img.id)),
  )
  const first = images[0]
  if (first) {
    await db().from('products').update({ image: first.url }).eq('id', first.product_id)
  }
}

/** Adds a YouTube video as a gallery slide (PLAN.md §7). */
export async function addVideo(productId: string, youtubeUrl: string, position: number) {
  const id = youtubeUrl.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1]
  if (!id) throw new UploadError('That does not look like a YouTube link.')

  const { data, error } = await db()
    .from('product_media')
    .insert({
      product_id: productId,
      type: 'YOUTUBE',
      url: `https://www.youtube.com/embed/${id}`,
      alt: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, // poster for the facade
      position,
    })
    .select()
    .single()

  if (error) throw new UploadError(error.message)
  return data as GalleryImage
}
