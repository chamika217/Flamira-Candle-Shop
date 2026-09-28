"use client";

import { Banknote, Truck, Sparkles, Gift } from "lucide-react";

const FEATURES = [
  {
    icon: <Banknote className="w-6 h-6 text-brand-terracotta" />,
    title: "Cash on Delivery",
    desc: "Pay easily at your doorstep across all 25 districts in Sri Lanka.",
    bg: "bg-orange-500/10",
  },
  {
    icon: <Truck className="w-6 h-6 text-brand-terracotta" />,
    title: "Island-Wide Courier",
    desc: "Fast & safely packaged delivery right to your door in 2–4 days.",
    bg: "bg-amber-500/10",
  },
  {
    icon: <Sparkles className="w-6 h-6 text-brand-terracotta" />,
    title: "100% Handcrafted",
    desc: "Hand-poured in small batches using premium natural soy wax & botanical oils.",
    bg: "bg-rose-500/10",
  },
  {
    icon: <Gift className="w-6 h-6 text-brand-terracotta" />,
    title: "Custom Orders & Hampers",
    desc: "Personalized wedding favors, corporate gift boxes, and custom scents.",
    bg: "bg-amber-500/10",
  },
];

export default function TrustFeatures() {
  return (
    <section className="relative -mt-6 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {FEATURES.map((item, idx) => (
          <div
            key={idx}
            className="group relative flex items-start gap-4 p-5 sm:p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-brand-border/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgba(192,96,58,0.12)] hover:border-brand-terracotta/40 hover:-translate-y-1 transition-all duration-300"
          >
            {/* Ambient hover glow inside card */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-terracotta/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Icon badge */}
            <div className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-xl ${item.bg} group-hover:scale-110 group-hover:bg-brand-terracotta group-hover:text-white transition-all duration-300`}>
              <div className="group-hover:text-white transition-colors">
                {item.icon}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <h2 className="font-serif text-base font-bold text-brand-brown group-hover:text-brand-terracotta transition-colors">
                {item.title}
              </h2>
              <p className="text-xs text-brand-stone mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
