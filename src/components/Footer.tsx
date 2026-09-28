import Link from "next/link";

// ---------------------------------------------------------------------------
// Real business details (from Facebook page)
// ---------------------------------------------------------------------------
const BUSINESS = {
  phone: "071 116 8590",
  phoneHref: "tel:+94711168590",
  email: "candlesflamira@gmail.com",
  location: "Nugegoda, Sri Lanka",
  tagline: "Scent your moments ✨ Soy Wax | Hand Poured",
  facebookUrl: "https://www.facebook.com/people/Flamira/",
  whatsappUrl: "https://wa.me/94711168590",
} as const;

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function FacebookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.829L.057 23.428a.5.5 0 0 0 .609.61l5.718-1.498A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.95 9.95 0 0 1-5.127-1.42l-.368-.216-3.813.999 1.016-3.714-.239-.383A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 5.33 5.33l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const QUICK_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Custom Orders", href: "/custom" },
  { label: "Contact", href: "/contact" },
  { label: "Track Order", href: "/track" },
] as const;

const POLICY_LINKS = [
  { label: "Delivery & Returns", href: "/policies/delivery-returns" },
  { label: "FAQ", href: "/policies/faq" },
  { label: "Terms", href: "/policies/terms" },
  { label: "Privacy", href: "/policies/privacy" },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Footer() {
  return (
    <footer className="bg-brand-ivory border-t border-brand-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* ---- Four columns ---- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="flex flex-col gap-4">
            {/* Wordmark */}
            <Link href="/" aria-label="Flamira — go to homepage" className="inline-block w-fit">
              <span className="font-serif text-2xl tracking-wide text-brand-brown hover:text-brand-terracotta transition-colors">
                Flamira
              </span>
            </Link>

            {/* Tagline */}
            <p className="text-sm text-brand-stone leading-relaxed">
              {BUSINESS.tagline}
            </p>

            {/* Contact details */}
            <ul className="flex flex-col gap-2 mt-1">
              <li>
                <a
                  href={BUSINESS.phoneHref}
                  className="flex items-center gap-2 text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
                >
                  <span className="text-brand-terracotta shrink-0"><PhoneIcon /></span>
                  {BUSINESS.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="flex items-center gap-2 text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
                >
                  <span className="text-brand-terracotta shrink-0"><MailIcon /></span>
                  {BUSINESS.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-brand-stone">
                <span className="text-brand-terracotta shrink-0"><PinIcon /></span>
                {BUSINESS.location}
              </li>
            </ul>

            {/* Social icons */}
            <div className="flex items-center gap-4 mt-1">
              <a
                href={BUSINESS.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Flamira on Facebook"
                className="text-brand-stone hover:text-brand-terracotta transition-colors"
              >
                <FacebookIcon />
              </a>
              <a
                href={BUSINESS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with Flamira on WhatsApp"
                className="text-brand-stone hover:text-brand-terracotta transition-colors"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-widest text-brand-brown mb-4">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2.5">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-widest text-brand-brown mb-4">
              Policies
            </h3>
            <ul className="flex flex-col gap-2.5">
              {POLICY_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-brand-stone hover:text-brand-terracotta transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get in touch */}
          <div>
            <h3 className="font-serif text-sm font-semibold uppercase tracking-widest text-brand-brown mb-4">
              Get In Touch
            </h3>
            <p className="text-sm text-brand-stone leading-relaxed">
              Have a question or a custom candle request? We&apos;d love to hear from you.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <a
                href={BUSINESS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-terracotta text-brand-white text-xs font-medium hover:bg-brand-terracotta-dark transition-colors w-fit"
              >
                <WhatsAppIcon />
                WhatsApp Us
              </a>
              <Link
                href="/contact"
                className="inline-block text-sm font-medium text-brand-terracotta hover:text-brand-terracotta-dark underline underline-offset-2 transition-colors"
              >
                Send a message →
              </Link>
            </div>
          </div>
        </div>

        {/* ---- Bottom bar ---- */}
        <div className="mt-10 pt-6 border-t border-brand-border text-center">
          <p className="text-xs text-brand-muted">
            &copy; 2026 Flamira. All rights reserved. — Where Fragrance Meets Elegance
          </p>
        </div>
      </div>
    </footer>
  );
}
