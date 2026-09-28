"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Gift, CheckCircle2, ShieldCheck, HeartHandshake } from "lucide-react";
import HeroPhotoModern from "./HeroPhotoModern";

interface HeroModernProps {
  bannerImageUrl?: string;
  bannerHeadline?: string | null;
  bannerSubtext?: string | null;
}

export default function HeroModern({
  bannerImageUrl,
  bannerHeadline,
  bannerSubtext,
}: HeroModernProps) {
  return (
    <section
      className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 bg-gradient-to-b from-brand-ivory/80 via-brand-cream to-brand-cream overflow-hidden"
      aria-label="Hero Showcase"
    >
      {/* Background Banner Override if set via Admin */}
      {bannerImageUrl ? (
        <>
          <Image
            src={bannerImageUrl}
            alt="Flamira hero banner"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-brand-brown/60 backdrop-blur-[2px]" aria-hidden="true" />
        </>
      ) : (
        /* Ambient Organic Lighting Glows */
        <>
          <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-terracotta/15 blur-[100px] animate-pulse-glow" aria-hidden="true" />
          <div className="pointer-events-none absolute top-1/2 -right-32 w-[450px] h-[450px] rounded-full bg-amber-400/15 blur-[120px] animate-pulse-glow" style={{ animationDelay: "2s" }} aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-brand-terracotta-light/10 blur-[80px]" aria-hidden="true" />
        </>
      )}

      {/* Main Grid Content */}
      <div className="relative mx-auto max-w-7xl flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* ---- Left: Captivating Copy + CTA + Badges ---- */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 z-10">
          
          {/* Top Pill Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-brand-border/80 shadow-sm text-xs font-semibold text-brand-terracotta animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-brand-terracotta animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-brand-terracotta" />
            <span className="tracking-wide uppercase text-[11px] text-brand-brown">
              Artisan Sri Lankan Crafts • 2026 Collection
            </span>
          </div>

          {/* Main Headline */}
          <h1 className={[
            "font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight",
            bannerImageUrl ? "text-white" : "text-brand-brown",
          ].join(" ")}>
            {bannerHeadline ? (
              bannerHeadline
            ) : (
              <>
                Handmade Home Décor &amp; Gifts,{" "}
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-brand-terracotta via-[#d86d42] to-amber-600 glow-text-terracotta">
                  Delivered Island-Wide
                  {/* Subtle underline curve accent */}
                  <svg
                    className="absolute -bottom-2 left-0 w-full text-brand-terracotta/40 hidden sm:block"
                    height="8"
                    viewBox="0 0 200 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 5.5C40 2 120 1.5 199 6"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className={[
            "text-base sm:text-lg max-w-xl leading-relaxed",
            bannerImageUrl ? "text-white/90" : "text-brand-stone",
          ].join(" ")}>
            {bannerSubtext ??
              "Lovingly crafted in Sri Lanka — Cash on Delivery available across all 25 districts. Pure soy wax candles, artisanal resin keepsakes & bespoke hampers made with heart."}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-2">
            <Link
              href="/shop"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-brand-terracotta to-[#a84e29] text-white font-medium text-sm sm:text-base shadow-lg shadow-brand-terracotta/25 hover:shadow-xl hover:shadow-brand-terracotta/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 animate-shimmer"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/custom"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/80 hover:bg-white text-brand-brown hover:text-brand-terracotta border border-brand-border/80 font-medium text-sm sm:text-base shadow-sm hover:shadow-md hover:border-brand-terracotta/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 backdrop-blur-sm"
            >
              <Gift className="w-4 h-4 text-brand-terracotta" />
              <span>Custom Gift Orders</span>
            </Link>
          </div>

          {/* Trust Highlights Strip */}
          <div className="pt-4 border-t border-brand-border/60 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-brand-stone">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cash on Delivery (Island-Wide)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-terracotta shrink-0" />
              <span>100% Non-Toxic Soy Wax</span>
            </div>
            <div className="flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Custom Hampers on Request</span>
            </div>
          </div>
        </div>

        {/* ---- Right: Interactive Polaroid 3D Stack Showcase ---- */}
        <div className="shrink-0 flex items-center justify-center w-full lg:w-auto py-2">
          <HeroPhotoModern />
        </div>
      </div>
    </section>
  );
}
