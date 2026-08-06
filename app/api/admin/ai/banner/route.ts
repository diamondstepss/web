import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/server/admin-guard'
import {
  getBannerOptions,
  generateBanner,
  AiServiceError,
  isAiConfigured,
} from '@/lib/ai-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const BUCKET = 'site-images'

/**
 * Generates cover artwork and keeps it.
 *
 * `GET` lists the occasions and formats on offer. `POST { occasion, format }`
 * generates one and returns a permanent URL.
 *
 * The keeping is the important part. ThinkrAI hands back a link the provider
 * deletes within the hour, so writing that link into `categories.image` would
 * give a shop a cover that worked all afternoon and was broken by morning —
 * the worst kind of bug, because nobody is looking when it breaks. The image is
 * downloaded here and re-uploaded to the shop's own bucket, and only that URL
 * is ever returned.
 *
 * Stored in `site-images`, not `product-images`: the Media page's orphan scan
 * treats anything in the product bucket without a `product_media` row as junk,
 * and a category cover has no such row. Sharing a bucket would mean the cleanup
 * tool offering to delete every category image on the site.
 */

export async function GET() {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  if (!isAiConfigured) return NextResponse.json({ configured: false })

  try {
    return NextResponse.json(await getBannerOptions())
  } catch (e) {
    if (e instanceof AiServiceError) {
      return NextResponse.json({ configured: false, error: e.message })
    }
    console.error('[ai/banner] options failed', e)
    return NextResponse.json({ configured: false })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  let body: { occasion?: unknown; format?: unknown; idempotencyKey?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const occasion = typeof body.occasion === 'string' ? body.occasion : ''
  const format = typeof body.format === 'string' ? body.format : 'square'
  if (!occasion) return NextResponse.json({ error: 'Choose a style.' }, { status: 400 })

  const idempotencyKey =
    typeof body.idempotencyKey === 'string' && body.idempotencyKey.length <= 100
      ? body.idempotencyKey
      : crypto.randomUUID()

  // ── Generate ──────────────────────────────────────────────────────────────
  let result
  try {
    result = await generateBanner(occasion, format, idempotencyKey)
  } catch (e) {
    if (e instanceof AiServiceError) {
      const status = e.kind === 'no-credits' ? 402 : e.kind === 'rate-limited' ? 429 : 502
      return NextResponse.json({ error: e.message, kind: e.kind }, { status })
    }
    console.error('[ai/banner] generation failed', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }

  // ── Keep it ───────────────────────────────────────────────────────────────
  try {
    const download = await fetch(result.url, { cache: 'no-store' })
    if (!download.ok) throw new Error(`download returned ${download.status}`)

    const bytes = new Uint8Array(await download.arrayBuffer())
    const contentType = download.headers.get('content-type') ?? 'image/webp'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('jpeg') ? 'jpg' : 'webp'
    const path = `banners/${occasion}-${format}-${Date.now()}.${ext}`

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    })
    if (error) throw new Error(error.message)

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      url: data.publicUrl,
      aspect: result.aspect,
      creditsCharged: result.creditsCharged,
      creditsRemaining: result.creditsRemaining,
    })
  } catch (e) {
    // The credit is already spent and the image did exist, so say what happened
    // rather than pretending the generation failed. The short-lived URL is
    // returned so the shop owner can at least save it by hand within the hour.
    console.error('[ai/banner] could not store the image', e)
    return NextResponse.json(
      {
        error: 'The image was generated but could not be saved. Download it now — this link expires shortly.',
        temporaryUrl: result.url,
        creditsCharged: result.creditsCharged,
        creditsRemaining: result.creditsRemaining,
      },
      { status: 502 },
    )
  }
}
