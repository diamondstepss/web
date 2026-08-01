'use client'

import Link from 'next/link'
import { ShieldCheck, Truck, RotateCcw, MapPin, MessageCircle } from 'lucide-react'
import PageHero from '@/components/PageHero'
import { SITE, ADDRESS_ONE_LINE } from '@/data/site'

const MILESTONES = [
  { year: '2018', title: 'A 200 sq ft shop', body: 'Diamond Stepss opens on Ladhewali Road, Jalandhar, stocking a single rack of sneakers.' },
  { year: '2021', title: 'Word spreads', body: 'Customers start driving in from across Punjab. We expand the store and add formal and sports ranges.' },
  { year: '2023', title: 'We go online', body: 'The first online order ships. Suddenly Jalandhar is not the limit — we deliver to every pincode in India.' },
  { year: '2026', title: '14 brands, one promise', body: 'Nike, Adidas, Jordan, Puma and ten more, plus a growing accessories range. Same promise as day one.' },
]

const VALUES = [
  { icon: ShieldCheck, title: '100% Genuine', body: 'Every pair authentic, in its original box with tags. No exceptions, no excuses.' },
  { icon: Truck, title: 'Fast, tracked delivery', body: `Dispatched from Jalandhar, delivered in ${SITE.deliveryDays}, tracked the whole way.` },
  { icon: RotateCcw, title: 'Easy returns', body: `${SITE.returnWindowDays} days to change your mind. Free size exchanges, no arguments.` },
]

export function AboutPage() {
  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero
        eyebrow="Established 2018"
        title="Our Story"
        lede="From a single shop on Ladhewali Road to doorsteps across India — built one honest pair at a time."
        crumbs={[{ label: 'About Us' }]}
        image="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1440&h=520&fit=crop&auto=format"
      />

      {/* Narrative */}
      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="max-w-2xl">
            <h2
              className="text-3xl md:text-[44px] font-black uppercase mb-6"
              style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              From Jalandhar
              <br />
              to your doorstep
            </h2>
            <div className="space-y-5 text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <p>
                Diamond Stepss started in 2018 as a small shoe shop in Jalandhar — a family business with a simple
                goal: bring authentic international footwear to people who deserve it, at prices that don't hurt.
              </p>
              <p>
                We built trust one pair at a time. Customers kept coming back because they knew every shoe was
                genuine, every price was fair, and every promise about delivery was kept. Word spread — first across
                Jalandhar, then Punjab, then the country.
              </p>
              <p>
                Today we stock fourteen of the world's most wanted footwear brands and a growing range of watches,
                bags, caps and belts. What hasn't changed is the shop counter mentality: if we wouldn't sell it to a
                neighbour, we won't ship it to you.
              </p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                "{SITE.tagline}" — that's not just a tagline. It's the promise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-pad" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-[1440px] px-6">
          <h2
            className="text-3xl md:text-[44px] font-black uppercase mb-10"
            style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            How we got here
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--border)' }}>
            {MILESTONES.map((m) => (
              <div key={m.year} className="p-6" style={{ background: 'var(--bg)' }}>
                <p
                  className="text-4xl font-black"
                  style={{ fontFamily: 'Outfit', color: 'var(--accent)', letterSpacing: '-0.03em' }}
                >
                  {m.year}
                </p>
                <p
                  className="mt-3 text-sm font-black uppercase tracking-wide"
                  style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}
                >
                  {m.title}
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {m.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6">
          <h2
            className="text-3xl md:text-[44px] font-black uppercase mb-10"
            style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            What we stand for
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="p-7"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: '3px solid var(--accent)' }}
              >
                <Icon size={26} style={{ color: 'var(--accent)' }} />
                <p
                  className="mt-5 text-lg font-black uppercase"
                  style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', letterSpacing: '-0.01em' }}
                >
                  {title}
                </p>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit us */}
      <section className="section-pad" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-[1440px] px-6 flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1">
            <h2
              className="text-3xl md:text-[44px] font-black uppercase mb-4"
              style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Come say hello
            </h2>
            <p className="text-sm leading-relaxed mb-6 max-w-md" style={{ color: 'var(--text-muted)' }}>
              The original shop is still open, and still the best place to try a pair on. Drop in {SITE.hours}.
            </p>
            <div className="flex items-start gap-3 mb-6">
              <MapPin size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {ADDRESS_ONE_LINE}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <a
                href={SITE.social.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 text-sm font-black uppercase tracking-widest text-white"
                style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
              >
                Get directions
              </a>
              <a
                href={SITE.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-7 py-3 text-sm font-black uppercase tracking-widest border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'Outfit' }}
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            </div>
          </div>

          <div className="lg:w-[420px] w-full shrink-0">
            <img
              src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=840&h=560&fit=crop&auto=format"
              alt="Footwear from the Diamond Stepss range"
              className="w-full object-cover"
              style={{ height: 300, border: '1px solid var(--border)' }}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6 text-center">
          <h2
            className="text-3xl md:text-[44px] font-black uppercase mb-6"
            style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Ready to step in?
          </h2>
          <Link
            href="/shop"
            className="inline-block px-9 py-3.5 text-sm font-black uppercase tracking-widest text-white"
            style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
          >
            Shop all products
          </Link>
        </div>
      </section>
    </div>
  )
}


export default AboutPage
