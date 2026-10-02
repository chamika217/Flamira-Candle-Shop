import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle, Heart, ArrowRight, Flame } from "lucide-react";

function FbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const BUSINESS = {
  phone: "071 116 8590",
  phoneHref: "tel:+94711168590",
  email: "candlesflamira@gmail.com",
  location: "Nugegoda, Sri Lanka",
  facebookUrl: "https://www.facebook.com/people/Flamira/",
  whatsappUrl: "https://wa.me/94711168590",
  whatsappMessage: "https://wa.me/94711168590?text=Hi%20Flamira%2C%20I%27d%20like%20to%20know%20more%20about%20your%20candles!",
} as const;

const SHOP_LINKS = [
  { label: "Soy Wax Candles", href: "/shop?category=candles-holders" },
  { label: "Gift Boxes & Hampers", href: "/shop?category=gift-boxes-hampers" },
  { label: "Resin Art", href: "/shop?category=resin-art" },
  { label: "Personalized Gifts", href: "/shop?category=personalized-gifts" },
  { label: "Seasonal Collection", href: "/shop?category=seasonal" },
] as const;

const QUICK_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Custom Orders", href: "/custom" },
  { label: "Track My Order", href: "/track" },
  { label: "Contact Us", href: "/contact" },
] as const;

const POLICY_LINKS = [
  { label: "Delivery & Returns", href: "/policies/delivery-returns" },
  { label: "FAQ", href: "/policies/faq" },
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms of Service", href: "/policies/terms" },
] as const;

const CRAFT_BADGES = [
  { icon: "🕯️", text: "Soy Wax" },
  { icon: "🤲", text: "Hand Poured" },
  { icon: "🌿", text: "All Natural" },
  { icon: "🇱🇰", text: "Made in Sri Lanka" },
  { icon: "📦", text: "Island-wide Delivery" },
] as const;

export default function Footer() {
  return (
    <footer className="bg-brand-brown text-white/90 mt-auto">
      {/* Top craft badges strip */}
      <div className="border-b border-white/10 bg-brand-brown/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {CRAFT_BADGES.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 items-start">

          {/* Brand column — full width on mobile, 1 col on lg */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex flex-col gap-5">
            {/* Logo & brand */}
            <Link href="/" className="group flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/flamira-logo.png" alt="Flamira" className="w-11 h-11 rounded-full object-cover border-2 border-brand-terracotta/40" />
              <div>
                <span className="font-serif text-2xl font-bold text-white group-hover:text-brand-terracotta-light transition-colors">
                  Flamira
                </span>
                <p className="text-[10px] tracking-widest text-white/50 uppercase mt-0 font-medium">Where Fragrance Meets Elegance</p>
              </div>
            </Link>

            <p className="text-sm text-white/65 leading-relaxed">
              Handcrafted soy wax candles, botanical wax sachets, resin art, and personalised gifts — made with love in Nugegoda, Sri Lanka.
            </p>

            {/* Contact */}
            <ul className="flex flex-col gap-2.5">
              <li>
                <a href={BUSINESS.phoneHref} className="flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />
                  {BUSINESS.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-2.5 text-sm text-white/65 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />
                  {BUSINESS.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-white/65">
                <MapPin className="w-3.5 h-3.5 text-brand-terracotta shrink-0" />
                {BUSINESS.location}
              </li>
            </ul>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a href={BUSINESS.facebookUrl} target="_blank" rel="noopener noreferrer"
                aria-label="Flamira on Facebook"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-brand-terracotta flex items-center justify-center transition-colors">
                <FbIcon />
              </a>
              <a href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer"
                aria-label="Flamira on WhatsApp"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-emerald-600 flex items-center justify-center transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop by Category */}
          <div className="flex flex-col gap-0">
            <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-white/90 mb-5">
              Shop By Category
            </h3>
            <ul className="flex flex-col gap-2.5">
              {SHOP_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group">
                    <ArrowRight className="w-3 h-3 text-brand-terracotta opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
              <li className="mt-2">
                <Link href="/shop"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-terracotta hover:text-white transition-colors">
                  View All Products →
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-0">
            <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-white/90 mb-5">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2.5">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href}
                    className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors group">
                    <ArrowRight className="w-3 h-3 text-brand-terracotta opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Policies — same column, visually separated */}
            <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-white/90 mb-4 mt-8">
              Policies
            </h3>
            <ul className="flex flex-col gap-2.5">
              {POLICY_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href}
                    className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors group">
                    <ArrowRight className="w-3 h-3 text-brand-terracotta opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get in touch / CTA */}
          <div className="flex flex-col gap-5">
            <h3 className="font-serif text-sm font-bold uppercase tracking-widest text-white/90 mb-0">
              Chat With Us
            </h3>
            <p className="text-sm text-white/60 leading-relaxed -mt-2">
              Have a custom order request? Planning a wedding or event? We&apos;d love to create something special for you.
            </p>
            <a href={BUSINESS.whatsappMessage} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30 w-fit">
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
            <Link href="/contact"
              className="inline-flex items-center gap-2 text-sm text-brand-terracotta hover:text-white transition-colors font-medium">
              Or use contact form
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* COD badge */}
            <div className="mt-auto p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-xs font-bold text-white/80 mb-2">🛍️ Safe &amp; Easy Shopping</p>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-white/55">✓ Cash on Delivery available</p>
                <p className="text-xs text-white/55">✓ Island-wide delivery</p>
                <p className="text-xs text-white/55">✓ 100% handmade &amp; authentic</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            &copy; 2026 Flamira. All rights reserved.
          </p>
          <p className="text-xs text-white/40 flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 text-brand-terracotta fill-brand-terracotta" /> in Sri Lanka
            <span className="text-white/20 mx-1">·</span>
            <Flame className="w-3 h-3 text-amber-400" /> Handcrafted Since 2024
          </p>
        </div>
      </div>
    </footer>
  );
}
