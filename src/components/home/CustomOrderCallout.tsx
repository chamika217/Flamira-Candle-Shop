"use client";

import Link from "next/link";
import Image from "next/image";
import { Gift, MessageCircle, Sparkles, Heart, CheckCircle, ArrowRight } from "lucide-react";

export default function CustomOrderCallout() {
  const customPerks = [
    "Personalized Scent Blends & Color Palettes",
    "Custom Gold-Foiled Name & Event Tags",
    "Luxury Satin Ribbon & Eco-Kraft Gift Boxing",
    "Special Discount Pricing on Bulk & Wedding Orders",
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="relative rounded-3xl sm:rounded-[36px] overflow-hidden bg-gradient-to-br from-brand-brown via-[#4b2615] to-[#34180c] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-white/10">
        
        {/* Decorative ambient lighting glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-terracotta/30 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Text & Action */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-semibold self-start">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Bespoke Gifting &amp; Events</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Looking for Custom Orders or Wedding Favors?
            </h2>

            <p className="text-sm sm:text-base text-white/85 leading-relaxed max-w-xl">
              From intimate wedding favors and birthday gift hampers to corporate gifting, we hand-craft personalized collections tailored exactly to your theme, aroma preferences, and budget.
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
              {customPerks.map((perk, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-100/90">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                href="/custom"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-brand-terracotta to-brand-terracotta-light text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 animate-shimmer"
              >
                <Gift className="w-4 h-4" />
                <span>Request Custom Order</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="https://wa.me/94770000000?text=Hello%20Flamira,%20I%20am%20interested%20in%20custom%20orders%20and%20gifting%20hampers!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Visual Image Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-sm aspect-square">
              {/* Stacked decorative photo cards */}
              <div className="absolute inset-0 rotate-6 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-brand-brown">
                <Image
                  src="/Animation5.png"
                  alt="Custom gift hamper setup"
                  fill
                  className="object-cover opacity-80"
                />
              </div>
              <div className="absolute inset-0 -rotate-3 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/30 bg-brand-brown group hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/Animation7.png"
                  alt="Custom wedding favors"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl text-brand-brown flex items-center gap-3">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold leading-tight">Personalized With Love</p>
                    <p className="text-[10px] text-brand-stone">Custom labels, cards &amp; ribbons</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
