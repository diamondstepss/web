import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/server/admin-guard'
import { generateDescription, AiServiceError, type DescriptionInput } from '@/lib/ai-service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Writes a product description through the AI add-on service.
 *
 * The browser sends a product id and nothing else. Everything the service is
 * told — brand, title, prices, sizes, photos — is read here from the database.
 *
 * That is deliberate. If the client supplied the product details, the admin UI
 * would be describing whatever it felt like rather than the row that is about
 * to be saved, and a spent credit would have bought copy for a product that
 * does not exist.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  let body: { productId?: unknown; idempotencyKey?: unknown; improve?: unknown }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const productId = typeof body.productId === 'string' ? body.productId : ''
  if (!productId) {
    return NextResponse.json({ error: 'Save the product first, then write its description.' }, { status: 400 })
  }

  // The client generates the key and reuses it when retrying, so a dropped
  // reply cannot be charged twice.
  const idempotencyKey =
    typeof body.idempotencyKey === 'string' && body.idempotencyKey.length <= 100
      ? body.idempotencyKey
      : crypto.randomUUID()

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: product, error } = await admin
    .from('products')
    .select('brand, title, price, mrp, sizes, image, description')
    .eq('id', productId)
    .maybeSingle()

  if (error || !product) {
    return NextResponse.json({ error: 'Could not find that product.' }, { status: 404 })
  }

  // Gallery images too — more angles means less guessing by the model.
  const { data: media } = await admin
    .from('product_media')
    .select('url')
    .eq('product_id', productId)
    .order('position')
    .limit(4)

  const imageUrls = [product.image, ...(media ?? []).map((m) => m.url as string)].filter(
    (u): u is string => typeof u === 'string' && u.startsWith('http'),
  )

  const input: DescriptionInput = {
    brand: product.brand as string,
    title: product.title as string,
    price: Number(product.price),
    mrp: Number(product.mrp),
    sizes: (product.sizes as string[]) ?? [],
    imageUrls: [...new Set(imageUrls)],
    existing: body.improve === true ? ((product.description as string | null) ?? null) : null,
  }

  try {
    const result = await generateDescription(input, idempotencyKey)
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof AiServiceError) {
      // 402 tells the UI to show the top-up prompt rather than a generic error.
      const status = e.kind === 'no-credits' ? 402 : e.kind === 'rate-limited' ? 429 : 502
      return NextResponse.json({ error: e.message, kind: e.kind }, { status })
    }
    console.error('[ai/description] unexpected', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
