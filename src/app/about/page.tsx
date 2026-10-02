import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Our Story — Flamira | Handmade Candles & Gifts Sri Lanka",
  description: "Flamira is a small handmade candle and home décor brand based in Nugegoda, Sri Lanka. Discover our story, our craft, and our passion for soy wax candles and personalised gifts.",
};

const VALUES = [
  {
    icon: "🕯️",
    title: "Pure Soy Wax",
    desc: "Every candle is made with 100% natural soy wax — clean-burning, long-lasting, and kind to your home.",
  },
  {
    icon: "🤲",
    title: "Truly Handmade",
    desc: "Each piece is poured, shaped, and finished entirely by hand in small batches. No factories, no shortcuts.",
  },
  {
    icon: "🌿",
    title: "Natural Ingredients",
    desc: "We use premium fragrance oils, dried botanicals, and natural wax — nothing artificial or harmful.",
  },
  {
    icon: "❤️",
    title: "Made with Love",
    desc: "Behind every order is a person who cares about the craft. We pour our heart into every single piece.",
  },
];

const PRODUCTS = [
  { emoji: "🕯️", name: "Soy Wax Candles", href: "/shop?category=candles-holders" },
  { emoji: "🎁", name: "Gift Boxes & Hampers", href: "/shop?category=gift-boxes-hampers" },
  { emoji: "🖼️", name: "Resin Art", href: "/shop?category=resin-art" },
  { emoji: "🌿", name: "Botanical Wax Sachets", href: "/shop" },
  { emoji: "💐", name: "Personalised Gifts", href: "/shop?category=personalized-gifts" },
  { emoji: "✉️", name: "Custom Orders", href: "/custom" },
];

const MILESTONES = [
  { year: "2024", event: "Flamira was born in a small kitchen in Nugegoda" },
  { year: "2025", event: "Launched island-wide delivery and our first gift hampers" },
  { year: "2026", event: "Growing our family of handcrafted creations 🕯️" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-cream">

      {/* ---- Hero ---- */}
      <section className="relative bg-brand-brown overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-terracotta/30 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-brand-terracotta text-xs font-bold tracking-widest uppercase mb-3">Our Story</p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Handmade in<br />
                <span className="text-brand-terracotta">Sri Lanka</span>
              </h1>
              <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                We started Flamira with a simple belief: that a beautiful home and a meaningful gift should be made by human hands, with genuine care — not on a factory assembly line.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
                <Link href="/shop"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-brand-terracotta text-white font-semibold text-sm hover:bg-brand-terracotta-dark transition-colors">
                  Shop Our Collection
                </Link>
                <Link href="/custom"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                  Custom Orders
                </Link>
              </div>
            </div>

            {/* Photo stack */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 shrink-0">
              <div className="absolute inset-0 rounded-3xl overflow-hidden border-4 border-white/10 rotate-3 shadow-2xl">
                <Image src="/Animation3.png" alt="Flamira handmade candle" fill className="object-cover" sizes="320px" />
              </div>
              <div className="absolute inset-4 rounded-2xl overflow-hidden border-4 border-white/20 -rotate-2 shadow-xl">
                <Image src="/Animation1.png" alt="Flamira craft" fill className="object-cover" sizes="300px" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-brand-terracotta text-white rounded-2xl px-4 py-2.5 shadow-lg rotate-2 z-10">
                <p className="text-xs font-bold">🤲 100% Handmade</p>
                <p className="text-[10px] text-white/80">Nugegoda, Sri Lanka</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Our values ---- */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-12">
          <p className="text-brand-terracotta text-xs font-bold tracking-widest uppercase mb-2">Why Choose Us</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-brown">Our Commitment to Craft</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map(({ icon, title, desc }) => (
            <div key={title} className="bg-brand-white rounded-3xl border border-brand-border p-6 hover:border-brand-terracotta/50 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-brand-terracotta/10 flex items-center justify-center text-2xl mb-4">
                {icon}
              </div>
              <h3 className="font-serif text-base font-bold text-brand-brown mb-2">{title}</h3>
              <p className="text-sm text-brand-stone leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Brand story ---- */}
      <section className="bg-brand-ivory border-y border-brand-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col gap-6 text-center">
            <p className="text-brand-terracotta text-xs font-bold tracking-widest uppercase">The Flamira Story</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-brown">From a Kitchen in Nugegoda</h2>
            <div className="max-w-2xl mx-auto flex flex-col gap-5 text-brand-stone leading-relaxed">
              <p>
                Flamira began in 2024 in a small kitchen in Nugegoda, Sri Lanka. What started as a personal passion for fragrance and handcraft quickly became something much bigger — a growing community of people who believe that beautiful things should be made by hand, with intention.
              </p>
              <p>
                Every candle we pour, every sachet we craft, every hamper we assemble — it&apos;s done with care and attention to detail. We source the finest soy wax, premium fragrance oils, and natural botanicals to create pieces that don&apos;t just look beautiful, but transform the feeling of a space.
              </p>
              <p>
                Today, Flamira delivers island-wide across Sri Lanka, bringing warmth, fragrance, and joy to homes, weddings, and special occasions. We&apos;re proud to be a truly handmade Sri Lankan brand.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-14 flex flex-col sm:flex-row items-start sm:items-center justify-center gap-0 sm:gap-0">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-2 sm:flex-1 relative">
                {/* Connector line */}
                {i < MILESTONES.length - 1 && (
                  <div className="hidden sm:block absolute top-4 left-1/2 right-0 h-0.5 bg-brand-border z-0" />
                )}
                <div className="relative z-10 w-8 h-8 rounded-full bg-brand-terracotta flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold">{i + 1}</span>
                </div>
                <div className="sm:text-center">
                  <p className="text-xs font-bold text-brand-terracotta">{m.year}</p>
                  <p className="text-sm text-brand-stone max-w-[160px]">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- What we make ---- */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-10">
          <p className="text-brand-terracotta text-xs font-bold tracking-widest uppercase mb-2">Our Creations</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-brown">What We Make</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {PRODUCTS.map(({ emoji, name, href }) => (
            <Link key={name} href={href}
              className="group bg-brand-white border border-brand-border rounded-2xl px-5 py-4 flex items-center gap-3 hover:border-brand-terracotta hover:shadow-md transition-all duration-300">
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-semibold text-brand-brown group-hover:text-brand-terracotta transition-colors">{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Pull quote ---- */}
      <section className="bg-brand-brown">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <p className="text-4xl text-brand-terracotta mb-4">✦</p>
          <blockquote className="font-serif text-xl sm:text-2xl text-white leading-relaxed">
            &ldquo;Every piece from Flamira carries a little piece of Sri Lanka&apos;s warmth, artistry, and heart.&rdquo;
          </blockquote>
          <p className="mt-4 text-white/50 text-sm">— The Flamira Team, Nugegoda</p>
          <Link href="/shop"
            className="inline-flex items-center gap-2 mt-8 px-7 py-3 rounded-full bg-brand-terracotta text-white font-semibold text-sm hover:bg-brand-terracotta-dark transition-colors">
            Explore Our Collection
          </Link>
        </div>
      </section>
    </div>
  );
}
