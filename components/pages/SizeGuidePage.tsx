'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ruler, Footprints, Clock, MessageCircle } from 'lucide-react'
import PageHero from '@/components/PageHero'
import { SITE } from '@/data/site'

/** UK is our master scale — every product is listed in UK sizes. */
const MENS = [
  { uk: '6', eu: '39', us: '7', cm: '24.5' },
  { uk: '7', eu: '40.5', us: '8', cm: '25.4' },
  { uk: '8', eu: '42', us: '9', cm: '26.2' },
  { uk: '9', eu: '43', us: '10', cm: '27.1' },
  { uk: '10', eu: '44.5', us: '11', cm: '28.0' },
  { uk: '11', eu: '46', us: '12', cm: '28.8' },
]

const WOMENS = [
  { uk: '3', eu: '36', us: '5', cm: '22.5' },
  { uk: '4', eu: '37', us: '6', cm: '23.4' },
  { uk: '5', eu: '38', us: '7', cm: '24.1' },
  { uk: '6', eu: '39', us: '8', cm: '25.0' },
  { uk: '7', eu: '40.5', us: '9', cm: '25.9' },
  { uk: '8', eu: '42', us: '10', cm: '26.7' },
]

const STEPS = [
  {
    icon: Footprints,
    title: 'Trace your foot',
    body: 'Stand on a sheet of paper with your heel against a wall. Mark the tip of your longest toe — that is not always the big toe.',
  },
  {
    icon: Ruler,
    title: 'Measure heel to toe',
    body: 'Measure the distance in centimetres from the wall edge of the paper to your mark. Do both feet and use the longer one.',
  },
  {
    icon: Clock,
    title: 'Measure in the evening',
    body: 'Feet swell through the day by up to half a size. An evening measurement gives you the fit you will actually wear.',
  },
]

export function SizeGuidePage() {
  const [scale, setScale] = useState<'mens' | 'womens'>('mens')
  const rows = scale === 'mens' ? MENS : WOMENS

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero
        eyebrow="Get the fit right"
        title="Size Guide"
        lede="Sizing is the number one reason people return shoes. Two minutes here saves you a return."
        crumbs={[{ label: 'Size Guide' }]}
        image="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1440&h=500&fit=crop&auto=format"
        compact
      />

      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Conversion table */}
            <div className="flex-1 min-w-0">
              <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
                <h2
                  className="text-2xl md:text-3xl font-black uppercase"
                  style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                >
                  Conversion Chart
                </h2>
                <div className="flex gap-px" style={{ background: 'var(--border)' }}>
                  {(['mens', 'womens'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setScale(s)}
                      className="px-5 py-2 text-xs font-black uppercase tracking-widest transition-colors duration-200"
                      style={{
                        background: scale === s ? 'var(--accent)' : 'var(--surface)',
                        color: scale === s ? '#fff' : 'var(--text-muted)',
                        fontFamily: 'Outfit',
                      }}
                    >
                      {s === 'mens' ? "Men's" : "Women's"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: 460 }}>
                  <thead>
                    <tr style={{ background: 'var(--accent)' }}>
                      {['UK', 'EU', 'US', 'Foot length (cm)'].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-widest text-white"
                          style={{ fontFamily: 'Outfit' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={r.uk}
                        style={{
                          background: i % 2 ? 'var(--surface)' : 'var(--bg)',
                          borderTop: '1px solid var(--border)',
                        }}
                      >
                        <td
                          className="px-5 py-3.5 font-black"
                          style={{ color: 'var(--accent)', fontFamily: 'Outfit' }}
                        >
                          UK {r.uk}
                        </td>
                        <td className="px-5 py-3.5" style={{ color: 'var(--text-primary)' }}>
                          {r.eu}
                        </td>
                        <td className="px-5 py-3.5" style={{ color: 'var(--text-primary)' }}>
                          {r.us}
                        </td>
                        <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                          {r.cm}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs mt-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                All products on this site are listed in <strong style={{ color: 'var(--text-primary)' }}>UK sizes</strong>.
                Conversions are approximate and can vary slightly between brands — match the foot-length column for
                the most reliable result.
              </p>
            </div>

            {/* Measuring guide */}
            <aside className="lg:w-96 shrink-0">
              <h2
                className="text-2xl md:text-3xl font-black uppercase mb-6"
                style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                Measure at home
              </h2>
              <div className="space-y-px" style={{ background: 'var(--border)' }}>
                {STEPS.map(({ icon: Icon, title, body }, i) => (
                  <div key={title} className="flex gap-4 p-5" style={{ background: 'var(--surface)' }}>
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{ width: 36, height: 36, background: 'rgba(255,51,51,0.12)', color: 'var(--accent)' }}
                    >
                      <Icon size={17} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-black uppercase tracking-wide"
                        style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}
                      >
                        {i + 1}. {title}
                      </p>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-6 p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--warning)' }}
              >
                <p
                  className="text-xs font-black uppercase tracking-widest mb-2"
                  style={{ color: 'var(--warning)', fontFamily: 'Outfit' }}
                >
                  Between sizes?
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Size up. Wide feet, high arches and thick socks all take up room, and a slightly roomy sneaker is
                  far more comfortable than a tight one. For loafers and formal shoes, stay true to size.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Help band */}
      <section className="section-pad" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-[1440px] px-6 text-center">
          <h2
            className="text-2xl md:text-[36px] font-black uppercase mb-3"
            style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Still not sure?
          </h2>
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
            Send us your foot measurement on WhatsApp and we'll tell you exactly which size to order in that style.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <a
              href={SITE.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-7 py-3 text-sm font-black uppercase tracking-widest text-white"
              style={{ background: '#25d366', fontFamily: 'Outfit' }}
            >
              <MessageCircle size={16} />
              Ask on WhatsApp
            </a>
            <Link
              href="/return-policy"
              className="px-7 py-3 text-sm font-black uppercase tracking-widest border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'Outfit' }}
            >
              Free size exchange
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}


export default SizeGuidePage
