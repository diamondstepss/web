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

  // First image in an empty gallery becomes the listing thumbnail too.
  if (position === 0) {
    await db().from('products').update({ image: publicUrl }).eq('id', productId)
  }

  return data as GalleryImage
}

const SITE_BUCKET = 'site-images'

/**
 * Uploads a cover image that isn't a product photo — category and collection
 * tiles, mainly. These have no `product_media` row to track them, so they go
 * to `site-images` rather than `product-images`: the Media page's orphan scan
 * treats anything in the product bucket without a row as junk, and a cover
 * image has no such row. Sharing a bucket would mean that scan offering to
 * delete every category tile on the site.
 */
export async function uploadSiteImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new UploadError(`${file.name} is not an image.`)
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new UploadError(`${file.name} is over 5 MB. Please compress it first.`)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await db().storage.from(SITE_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw new UploadError(error.message)

  const {
    data: { publicUrl },
  } = db().storage.from(SITE_BUCKET).getPublicUrl(path)

  return publicUrl
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

  // Removing the main image promotes whatever is now first — or clears the
  // listing thumbnail if the gallery is empty — so it never points at a dead row.
  const { data: remaining } = await db()
    .from('product_media')
    .select('url')
    .eq('product_id', image.product_id)
    .eq('type', 'IMAGE')
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()
  await db().from('products').update({ image: remaining?.url ?? null }).eq('id', image.product_id)
}

/**
 * Removes every uploaded file belonging to a product.
 *
 * Deleting a product cascades its `product_media` rows, but a cascade knows
 * nothing about object storage — so before this existed, every deleted product
 * left its photographs in the bucket permanently. Invisible, unbounded, and
 * counting against the storage quota with nothing in the admin able to see or
 * clear them.
 *
 * Called before the product row goes, because afterwards there is no longer a
 * list of what belonged to it.
 */
export async function deleteProductFiles(productId: string): Promise<void> {
  // Files are stored under a folder named for the product id — see uploadImage.
  const { data, error } = await db().storage.from(BUCKET).list(productId, { limit: 100 })
  if (error || !data?.length) return

  const paths = data.map((f) => `${productId}/${f.name}`)
  const { error: removeError } = await db().storage.from(BUCKET).remove(paths)

  // Logged, not thrown: a stranded file is untidy, a product that will not
  // delete is a blocked shop owner.
  if (removeError) console.error('[media] could not remove files for', productId, removeError)
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

/**
 * Files sitting in the bucket that no product row points at.
 *
 * Two ways they appear: a product deleted before `deleteProductFiles` existed,
 * and an upload that succeeded in storage but whose database row failed. Both
 * are invisible in the admin and both count against the storage quota, so the
 * Media page needs to be able to find them.
 */
export interface Orphan {
  path: string
  size: number
  updatedAt: string | null
}

export async function findOrphanedFiles(): Promise<Orphan[]> {
  const client = db()

  // Every path currently referenced by a gallery row.
  const { data: rows } = await client.from('product_media').select('url')
  const marker = `/${BUCKET}/`
  const referenced = new Set(
    (rows ?? [])
      .map((r) => String(r.url))
      .filter((u) => u.includes(marker))
      .map((u) => decodeURIComponent(u.split(marker)[1] ?? '')),
  )

  const { data: folders, error } = await client.storage.from(BUCKET).list('', { limit: 1000 })
  if (error || !folders) return []

  const orphans: Orphan[] = []

  for (const folder of folders) {
    // Supabase represents a folder as an entry with no id.
    if (folder.id) continue

    const { data: files } = await client.storage.from(BUCKET).list(folder.name, { limit: 100 })
    for (const f of files ?? []) {
      const path = `${folder.name}/${f.name}`
      if (referenced.has(path)) continue
      orphans.push({
        path,
        size: Number(f.metadata?.size ?? 0),
        updatedAt: (f.updated_at as string) ?? null,
      })
    }
  }

  return orphans
}

/** Removes orphaned files. Returns how many actually went. */
export async function deleteFiles(paths: string[]): Promise<number> {
  if (paths.length === 0) return 0
  const { data, error } = await db().storage.from(BUCKET).remove(paths)
  if (error) throw new UploadError(error.message)
  return data?.length ?? 0
}
