import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/server/admin-guard'
import { getPhotoPresets, enhancePhoto, AiServiceError, isAiConfigured } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const BUCKET = 'product-images'

/**
 * Cleans up one existing product photo and keeps it.
 *
 * `GET` lists the presets on offer. `POST { imageId, presetId }` reads that
 * image's current URL from the database — never from the browser, so the
 * credit spent always buys a clean-up of a photo that is actually on this
 * product, the same reason the description route reads its facts from the
 * row rather than trusting what the client sends — enhances it, and
 * overwrites the same `product_media` row in place. Position, "main image"
 * status and alt text all stay put; only the url changes.
 *
 * The old file in storage is left behind rather than deleted here: the Media
 * page's orphan scan (`lib/media.ts` `findOrphanedFiles`) already exists to
 * catch exactly this, and deleting it inline would be one more way this route
 * can fail after the credit is already spent.
 */

export async function GET() {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  if (!isAiConfigured) return NextResponse.json({ configured: false })

  try {
    return NextResponse.json(await getPhotoPresets())
  } catch (e) {
    if (e instanceof AiServiceError) {
      return NextResponse.json({ configured: false, error: e.message })
    }
    console.error('[ai/photo] presets failed', e)
    return NextResponse.json({ configured: false })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  let body: { imageId?: unknown; presetId?: unknown; idempotencyKey?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const imageId = typeof body.imageId === 'string' ? body.imageId : ''
  const presetId = typeof body.presetId === 'string' ? body.presetId : ''
  if (!imageId || !presetId) {
    return NextResponse.json({ error: 'Choose a photo and a preset.' }, { status: 400 })
  }

  const idempotencyKey =
    typeof body.idempotencyKey === 'string' && body.idempotencyKey.length <= 100
      ? body.idempotencyKey
      : crypto.randomUUID()

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: image, error: findError } = await admin
    .from('product_media')
    .select('id, product_id, url, type')
    .eq('id', imageId)
    .maybeSingle()

  if (findError || !image || image.type !== 'IMAGE') {
    return NextResponse.json({ error: 'Could not find that photo.' }, { status: 404 })
  }

  // ── Enhance ───────────────────────────────────────────────────────────────
  let result
  try {
    result = await enhancePhoto(image.url as string, presetId, idempotencyKey)
  } catch (e) {
    if (e instanceof AiServiceError) {
      const status = e.kind === 'no-credits' ? 402 : e.kind === 'rate-limited' ? 429 : 502
      return NextResponse.json({ error: e.message, kind: e.kind }, { status })
    }
    console.error('[ai/photo] enhance failed', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }

  // ── Keep it ───────────────────────────────────────────────────────────────
  try {
    const download = await fetch(result.url, { cache: 'no-store' })
    if (!download.ok) throw new Error(`download returned ${download.status}`)

    const bytes = new Uint8Array(await download.arrayBuffer())
    const contentType = download.headers.get('content-type') ?? 'image/webp'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'webp'
    const path = `${image.product_id}/${Date.now()}-cleaned.${ext}`

    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })
    if (upErr) throw new Error(upErr.message)

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)

    const { error: updateError } = await admin
      .from('product_media')
      .update({ url: pub.publicUrl })
      .eq('id', imageId)
    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({
      url: pub.publicUrl,
      framed: result.framed,
      creditsCharged: result.creditsCharged,
      creditsRemaining: result.creditsRemaining,
    })
  } catch (e) {
    // The credit is already spent and the cleaned image does exist, so say
    // what happened rather than pretending the generation failed — same
    // fallback the banner route uses when its own storage write fails.
    console.error('[ai/photo] could not save the cleaned photo', e)
    return NextResponse.json(
      {
        error:
          'The photo was cleaned up but could not be saved. Download it now — this link expires shortly.',
        temporaryUrl: result.url,
        creditsCharged: result.creditsCharged,
        creditsRemaining: result.creditsRemaining,
      },
      { status: 502 },
    )
  }
}
