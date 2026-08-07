import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Stand-in for the AI add-on service, for development only.
 *
 * It implements the contract in lib/ai-service.ts — same paths, same auth
 * header, same status codes, same idempotency behaviour — so the admin UI can
 * be built and looked at before the real service exists, and so the day it does
 * exist the only change is one environment variable.
 *
 * Point at it with:
 *
 *     AI_SERVICE_URL=http://localhost:3000/api/dev/ai-stub
 *     AI_SERVICE_KEY=dev
 *
 * It writes no real copy. The text it returns is obviously placeholder on
 * purpose — a stub that produced plausible descriptions would eventually get
 * one saved to a live product.
 *
 * 404s in production. The balance lives in memory, so it resets whenever the
 * dev server restarts.
 */

let credits = 25
const seen = new Map<string, unknown>()

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, await ctx.params)
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(req, await ctx.params)
}

async function handle(req: NextRequest, { path }: { path: string[] }) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 })
  }

  if (!req.headers.get('authorization')?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'missing bearer token' }, { status: 401 })
  }

  const route = path.join('/')

  if (route === 'v1/balance') {
    return NextResponse.json({ credits, lowWater: 5 })
  }

  if (route === 'v1/generate/description') {
    const key = req.headers.get('idempotency-key')
    if (key && seen.has(key)) return NextResponse.json(seen.get(key))

    if (credits < 1) {
      return NextResponse.json({ error: 'You have run out of credits.' }, { status: 402 })
    }

    const body = (await req.json()) as { brand?: string; title?: string; sizes?: string[] }

    // A visible pause, because the real thing takes a few seconds and the UI
    // needs to be built for that rather than for an instant reply.
    await new Promise((r) => setTimeout(r, 1200))

    credits -= 1
    const result = {
      description:
        `[STUB — no AI service connected] Placeholder copy for the ${body.brand ?? ''} ` +
        `${body.title ?? ''}. The real service will describe what it can actually see in ` +
        `the product photos${body.sizes?.length ? `, across UK ${body.sizes.join(', ')}` : ''}. ` +
        `Do not save this to a live product.`,
      creditsCharged: 1,
      creditsRemaining: credits,
    }
    if (key) seen.set(key, result)
    return NextResponse.json(result)
  }

  if (route === 'v1/enhance/photo') {
    if (req.method === 'GET') {
      return NextResponse.json({
        configured: true,
        creditsPerPhoto: 5,
        presets: [
          {
            id: 'clean-white',
            label: 'Clean white background',
            description: 'Stub preset — hands the same photo back unchanged.',
          },
        ],
      })
    }

    const key = req.headers.get('idempotency-key')
    if (key && seen.has(key)) return NextResponse.json(seen.get(key))

    if (credits < 5) {
      return NextResponse.json(
        { error: 'You have run out of credits.', creditsRemaining: credits },
        { status: 402 },
      )
    }

    const body = (await req.json()) as { imageUrl?: string; presetId?: string }
    if (!body.imageUrl) {
      return NextResponse.json({ error: 'imageUrl must be a public https URL.' }, { status: 422 })
    }

    await new Promise((r) => setTimeout(r, 1200))

    credits -= 5
    const result = {
      // The stub does not actually enhance anything — it hands the same photo
      // back so the caller's download-and-store step can still be exercised
      // locally, same reasoning as the placeholder description text above.
      url: body.imageUrl,
      framed: true,
      expiresInSeconds: 3600,
      creditsCharged: 5,
      creditsRemaining: credits,
    }
    if (key) seen.set(key, result)
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: `stub has no route ${route}` }, { status: 404 })
}
