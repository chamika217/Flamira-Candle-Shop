import type { Metadata } from "next";

export const metadata: Metadata = {
  title:       "About — Flamira",
  description: "Learn about Flamira — a small handmade candle and home décor shop based in Nugegoda, Sri Lanka. Soy wax, hand poured, island-wide delivery.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="bg-brand-ivory border-b border-brand-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-brand-brown mb-4">
            Our Story
          </h1>
          <p className="text-brand-stone text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Scent your moments ✨ — Where Fragrance Meets Elegance
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl font-semibold text-brand-brown">
            Handmade with heart, in Sri Lanka
          </h2>
          <p className="text-brand-stone leading-relaxed">
            Flamira is a small home décor and gifts brand based in Nugegoda, Sri Lanka.
            Every candle is hand poured using premium soy wax, crafted in small batches
            to ensure quality and care in every piece.
          </p>
          <p className="text-brand-stone leading-relaxed">
            We believe that a beautiful home and a meaningful gift don&apos;t have to come
            from a big factory. Our pieces are made locally, with love, and delivered
            island-wide — straight to your door.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl font-semibold text-brand-brown">
            What we make
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              "🕯️ Soy Wax Candles",
              "🎁 Gift Boxes & Hampers",
              "🖼️ Resin Art",
              "🌿 Home Décor",
              "💐 Personalized Gifts",
              "✉️ Custom Orders",
            ].map((item) => (
              <li key={item}
                className="bg-brand-white border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-stone font-medium">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-brand-ivory rounded-2xl border border-brand-border p-6 sm:p-8">
          <p className="font-serif text-lg text-brand-brown text-center leading-relaxed">
            &ldquo;Every piece from Flamira carries a little piece of Sri Lanka&rsquo;s
            warmth and artistry.&rdquo;
          </p>
        </section>
      </div>
    </div>
  );
}
