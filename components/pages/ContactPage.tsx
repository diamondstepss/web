'use client'

import { useState } from 'react'
import { MessageCircle, MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react'
import PageHero from '@/components/PageHero'
import { SITE } from '@/data/site'
import { InstagramIcon, FacebookIcon, WhatsAppIcon, GoogleMapsIcon } from '@/components/SocialIcons'

const CHANNELS = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: SITE.phone,
    note: 'Fastest — usually a reply in minutes',
    href: SITE.social.whatsapp,
    tint: '#25d366',
  },
  { icon: Phone, label: 'Call us', value: SITE.phone, note: SITE.hours, href: SITE.phoneHref, tint: 'var(--accent)' },
  {
    icon: Mail,
    label: 'Email',
    value: SITE.email,
    note: 'We reply within 24 hours',
    href: `mailto:${SITE.email}`,
    tint: 'var(--accent)',
  },
]

const SUBJECTS = ['Order status', 'Returns & exchange', 'Size help', 'Product question', 'Something else']

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: SUBJECTS[0], message: '' })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const fieldStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div style={{ background: 'var(--bg)' }}>
      <PageHero
        eyebrow="We're listening"
        title="Contact Us"
        lede="Order question, sizing doubt, or a problem with a delivery — reach us however suits you."
        crumbs={[{ label: 'Contact' }]}
        compact
      />

      {/* Channels */}
      <section className="pt-12">
        <div className="mx-auto max-w-[1440px] px-6">
          <div className="grid md:grid-cols-3 gap-4">
            {CHANNELS.map(({ icon: Icon, label, value, note, href, tint }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="p-6 transition-transform duration-200 hover:-translate-y-1"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: `3px solid ${tint}` }}
              >
                <Icon size={22} style={{ color: tint }} />
                <p
                  className="mt-4 text-xs font-black uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
                >
                  {label}
                </p>
                <p className="mt-1 text-base font-bold break-all" style={{ color: 'var(--text-primary)' }}>
                  {value}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {note}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Form + store */}
      <section className="section-pad">
        <div className="mx-auto max-w-[1440px] px-6 flex flex-col lg:flex-row gap-12">
          {/* Form */}
          <div className="flex-1 min-w-0">
            <h2
              className="text-2xl md:text-3xl font-black uppercase mb-6"
              style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Send a message
            </h2>

            {submitted ? (
              <div
                className="p-10 text-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderTop: '3px solid var(--success)' }}
              >
                <CheckCircle size={44} style={{ color: 'var(--success)', margin: '0 auto 20px' }} />
                <h3
                  className="text-xl font-black uppercase mb-2"
                  style={{ fontFamily: 'Outfit', color: 'var(--text-primary)' }}
                >
                  Message received
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  We'll get back to you within 24 hours. For anything urgent, WhatsApp is faster.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-black uppercase tracking-widest underline"
                  style={{ color: 'var(--accent)', fontFamily: 'Outfit' }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  setSubmitted(true)
                }}
                className="p-6 space-y-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Your name">
                    <input required value={form.name} onChange={set('name')} className="w-full px-4 py-3 text-sm outline-none" style={fieldStyle} />
                  </Field>
                  <Field label="Mobile number">
                    <input required type="tel" placeholder="+91" value={form.phone} onChange={set('phone')} className="w-full px-4 py-3 text-sm outline-none" style={fieldStyle} />
                  </Field>
                </div>
                <Field label="Email address">
                  <input required type="email" value={form.email} onChange={set('email')} className="w-full px-4 py-3 text-sm outline-none" style={fieldStyle} />
                </Field>
                <Field label="What's it about?">
                  <select value={form.subject} onChange={set('subject')} className="w-full px-4 py-3 text-sm outline-none" style={fieldStyle}>
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Message">
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={set('message')}
                    className="w-full px-4 py-3 text-sm outline-none resize-none"
                    style={fieldStyle}
                  />
                </Field>
                <button
                  type="submit"
                  className="px-9 py-3.5 text-sm font-black uppercase tracking-widest text-white"
                  style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
                >
                  Send message
                </button>
              </form>
            )}
          </div>

          {/* Store details */}
          <aside className="lg:w-96 shrink-0">
            <h2
              className="text-2xl md:text-3xl font-black uppercase mb-6"
              style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Visit the store
            </h2>

            <div style={{ border: '1px solid var(--border)' }}>
              <img
                src="https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=400&fit=crop&auto=format"
                alt="Sneakers from the Diamond Stepss range"
                className="w-full object-cover"
                style={{ height: 180 }}
              />
              <div className="p-5 space-y-5" style={{ background: 'var(--surface)' }}>
                {[
                  { icon: MapPin, label: 'Address', text: `${SITE.address.line1}\n${SITE.address.city} ${SITE.address.pincode}, ${SITE.address.state}` },
                  { icon: Clock, label: 'Store hours', text: SITE.hours },
                ].map(({ icon: Icon, label, text }) => (
                  <div key={label} className="flex gap-3">
                    <Icon size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p
                        className="text-xs font-black uppercase tracking-widest mb-1"
                        style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
                      >
                        {label}
                      </p>
                      <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {text}
                      </p>
                    </div>
                  </div>
                ))}

                <a
                  href={SITE.social.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-3 text-xs font-black uppercase tracking-widest text-white"
                  style={{ background: 'var(--accent)', fontFamily: 'Outfit' }}
                >
                  Open in Google Maps
                </a>
              </div>
            </div>

            <div className="flex gap-px mt-6" style={{ background: 'var(--border)' }}>
              {[
                { Icon: InstagramIcon, href: SITE.social.instagram, label: 'Instagram', tint: '#E1306C' },
                { Icon: FacebookIcon, href: SITE.social.facebook, label: 'Facebook', tint: '#1877F2' },
                { Icon: WhatsAppIcon, href: SITE.social.whatsapp, label: 'WhatsApp', tint: '#25D366' },
                { Icon: GoogleMapsIcon, href: SITE.social.maps, label: 'Google Maps', tint: '#EA4335' },
              ].map(({ Icon, href, label, tint }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex-1 flex items-center justify-center py-4 transition-colors duration-200"
                  style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = tint)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Icon size={19} />
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs font-black uppercase tracking-widest mb-2"
        style={{ color: 'var(--text-muted)', fontFamily: 'Outfit' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}


export default ContactPage
