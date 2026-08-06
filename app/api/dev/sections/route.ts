import { NextResponse } from 'next/server'
import { getHomeSections } from '@/lib/sections'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Development-only view of what the homepage will render. 404s in production. */
export async function GET() {
  if (process.env.NODE_ENV === 'production') return new NextResponse('Not found', { status: 404 })
  const sections = await getHomeSections()
  return NextResponse.json(
    sections.map((s) => ({
      position: s.position,
      type: s.type,
      title: s.title,
      source: s.source,
      sourceSlug: s.sourceSlug,
      products: s.products.length,
    })),
  )
}
