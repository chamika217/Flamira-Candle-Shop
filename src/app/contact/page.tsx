import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Flamira",
  description:
    "Get in touch with Flamira. Call, WhatsApp, or email us — we're based in Nugegoda, Sri Lanka.",
};

// ---------------------------------------------------------------------------
// Business details
// ---------------------------------------------------------------------------
const BUSINESS = {
  phone: "071 116 8590",
  phoneHref: "tel:+94711168590",
  email: "candlesflamira@gmail.com",
  location: "Nugegoda, Sri Lanka",
  tagline: "Scent your moments ✨",
  facebookUrl: "https://www.facebook.com/people/Flamira/",
  whatsappUrl: "https://wa.me/94711168590",
  whatsappMessage: "https://wa.me/94711168590?text=Hi%20Flamira%2C%20I%27d%20like%20to%20know%20more%20about%20your%20candles!",
} as const;

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 5.33 5.33l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.829L.057 23.428a.5.5 0 0 0 .609.61l5.718-1.498A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.127-1.42l-.368-.216-3.813.999 1.016-3.714-.239-.383A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-cream">

      {/* Hero strip */}
      <div className="bg-brand-ivory border-b border-brand-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col items-center text-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/flamira-logo.png"
            alt="Flamira"
            className="w-24 h-24 object-cover rounded-full"
          />
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-brand-brown">
            Get In Touch
          </h1>
          <p className="text-brand-stone text-sm sm:text-base max-w-md">
            {BUSINESS.tagline} — We&apos;re a small candle shop based in Nugegoda.
            Reach out for orders, custom requests, or just to say hello!
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Phone */}
          <a
            href={BUSINESS.phoneHref}
            className="group flex items-start gap-4 bg-brand-white rounded-2xl border border-brand-border p-6 hover:border-brand-terracotta transition-colors"
          >
            <span className="text-brand-terracotta shrink-0 mt-0.5">
              <PhoneIcon />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-1">
                Call Us
              </p>
              <p className="font-serif text-lg font-semibold text-brand-brown group-hover:text-brand-terracotta transition-colors">
                {BUSINESS.phone}
              </p>
              <p className="text-xs text-brand-muted mt-1">
                Mon – Sat, 9am – 7pm
              </p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={BUSINESS.whatsappMessage}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 bg-brand-white rounded-2xl border border-brand-border p-6 hover:border-brand-terracotta transition-colors"
          >
            <span className="text-brand-terracotta shrink-0 mt-0.5">
              <WhatsAppIcon />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-1">
                WhatsApp
              </p>
              <p className="font-serif text-lg font-semibold text-brand-brown group-hover:text-brand-terracotta transition-colors">
                {BUSINESS.phone}
              </p>
              <p className="text-xs text-brand-muted mt-1">
                Tap to open WhatsApp chat
              </p>
            </div>
          </a>

          {/* Email */}
          <a
            href={`mailto:${BUSINESS.email}`}
            className="group flex items-start gap-4 bg-brand-white rounded-2xl border border-brand-border p-6 hover:border-brand-terracotta transition-colors"
          >
            <span className="text-brand-terracotta shrink-0 mt-0.5">
              <MailIcon />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-1">
                Email
              </p>
              <p className="font-serif text-base font-semibold text-brand-brown group-hover:text-brand-terracotta transition-colors break-all">
                {BUSINESS.email}
              </p>
              <p className="text-xs text-brand-muted mt-1">
                We reply within 24 hours
              </p>
            </div>
          </a>

          {/* Location */}
          <div className="flex items-start gap-4 bg-brand-white rounded-2xl border border-brand-border p-6">
            <span className="text-brand-terracotta shrink-0 mt-0.5">
              <PinIcon />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-1">
                Location
              </p>
              <p className="font-serif text-lg font-semibold text-brand-brown">
                {BUSINESS.location}
              </p>
              <p className="text-xs text-brand-muted mt-1">
                Island-wide delivery available
              </p>
            </div>
          </div>

          {/* Facebook — full width */}
          <a
            href={BUSINESS.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group sm:col-span-2 flex items-start gap-4 bg-brand-white rounded-2xl border border-brand-border p-6 hover:border-brand-terracotta transition-colors"
          >
            <span className="text-brand-terracotta shrink-0 mt-0.5">
              <FacebookIcon />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-1">
                Facebook Page
              </p>
              <p className="font-serif text-lg font-semibold text-brand-brown group-hover:text-brand-terracotta transition-colors">
                Flamira
              </p>
              <p className="text-xs text-brand-muted mt-1">
                Follow us for new arrivals, behind-the-scenes, and special offers
              </p>
            </div>
          </a>
        </div>

        {/* Candle shop badge */}
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <p className="text-brand-muted text-sm">
            🕯️ Soy Wax · Hand Poured · Handmade in Sri Lanka
          </p>
        </div>
      </div>
    </div>
  );
}
