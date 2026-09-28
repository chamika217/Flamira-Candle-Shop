import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Custom Orders — Flamira",
  description: "Request a personalised or custom-made candle, gift box, or home décor piece from Flamira, Sri Lanka.",
};

export default function CustomOrdersPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="bg-brand-ivory border-b border-brand-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-brand-brown mb-4">
            Custom Orders
          </h1>
          <p className="text-brand-stone text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Looking for something truly unique? We&apos;d love to create a personalised piece just for you.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 flex flex-col gap-10">
        {/* What we can do */}
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl font-semibold text-brand-brown">What we can create</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { emoji: "🕯️", title: "Custom Candles", desc: "Personalised scents, colours, and labels for any occasion." },
              { emoji: "🎁", title: "Gift Boxes & Hampers", desc: "Curated gift sets with your choice of items and a personal note." },
              { emoji: "🖼️", title: "Resin & Home Décor", desc: "One-of-a-kind resin art and décor pieces made to your specification." },
              { emoji: "🏢", title: "Corporate & Bulk Orders", desc: "Branded gifts and bulk orders for events, weddings, and businesses." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-brand-white rounded-2xl border border-brand-border p-5">
                <span className="text-2xl">{emoji}</span>
                <h3 className="font-serif text-base font-semibold text-brand-brown mt-2 mb-1">{title}</h3>
                <p className="text-sm text-brand-stone leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to order */}
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl font-semibold text-brand-brown">How it works</h2>
          <ol className="flex flex-col gap-3">
            {[
              "Send us a message on WhatsApp or via the contact form describing what you have in mind.",
              "We'll get back to you within 24 hours with options, pricing, and estimated lead time.",
              "Confirm your order and we'll get to work crafting your piece.",
              "Your custom order is delivered island-wide via Cash on Delivery.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-brand-terracotta/15 text-brand-terracotta text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-brand-stone text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href="https://wa.me/94711168590?text=Hi%20Flamira%2C%20I%27d%20like%20to%20place%20a%20custom%20order!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 rounded-full bg-brand-terracotta text-brand-white font-medium text-sm hover:bg-brand-terracotta-dark active:scale-95 transition-all"
          >
            WhatsApp Us
          </a>
          <Link href="/contact"
            className="text-sm text-brand-terracotta hover:text-brand-terracotta-dark underline underline-offset-2 transition-colors">
            Or use the contact form →
          </Link>
        </div>
      </div>
    </div>
  );
}
