"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles, Leaf, HeartHandshake, PackageCheck, Award, ArrowRight } from "lucide-react";

const PROCESS_STEPS = [
  {
    step: "01",
    icon: <Leaf className="w-5 h-5 text-brand-terracotta" />,
    title: "100% Pure Botanical Wax",
    desc: "We ethically source renewable soy wax and phthalate-free fragrance oils for a slow, soot-free, and clean burn.",
  },
  {
    step: "02",
    icon: <HeartHandshake className="w-5 h-5 text-brand-terracotta" />,
    title: "Artisanal Small-Batch Pouring",
    desc: "Every single candle and wax sachet is hand-blended, hand-poured, and inspected with meticulous Sri Lankan craftsmanship.",
  },
  {
    step: "03",
    icon: <PackageCheck className="w-5 h-5 text-brand-terracotta" />,
    title: "Aesthetic & Eco-Luxe Gifting",
    desc: "Wrapped in sustainable kraft boxes with dried botanicals, satin ribbons, and personalized handwritten cards.",
  },
];

const STATS = [
  { value: "5,000+", label: "Gifts Handcrafted" },
  { value: "100%", label: "Pure Soy Wax" },
  { value: "25", label: "Districts Island-Wide" },
  { value: "4.9 ★", label: "Customer Rating" },
];

export default function ArtisanStorySection() {
  return (
    <section className="relative py-20 sm:py-28 bg-white overflow-hidden" aria-labelledby="story-heading">
      {/* Background Subtle Gradient Blobs */}
      <div className="pointer-events-none absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-brand-terracotta/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ---- Left: Visual Story Collage ---- */}
          <div className="lg:col-span-6 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Primary Large Image */}
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-brand-ivory">
                <Image
                  src="/Animation1.png"
                  alt="Artisan candle handcrafting"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-brown/60 via-transparent to-transparent" />
                
                {/* Floating Quote Card inside */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-lg">
                  <p className="font-serif italic text-xs sm:text-sm text-brand-brown leading-relaxed">
                    &ldquo;Every piece carries the gentle scent of relaxation and the warmth of a handcrafted touch.&rdquo;
                  </p>
                  <p className="text-[11px] font-semibold text-brand-terracotta mt-1">
                    — Flamira Studio, Sri Lanka
                  </p>
                </div>
              </div>

              {/* Secondary Floating Image */}
              <div className="absolute -bottom-8 -right-6 sm:-right-8 w-44 sm:w-56 aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white hidden sm:block animate-float-slow">
                <Image
                  src="/Animation6.png"
                  alt="Botanical wax sachet details"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Artisan Badge */}
              <div className="absolute -top-6 -left-6 bg-brand-terracotta text-white p-4 rounded-3xl shadow-xl border-4 border-white flex items-center gap-3">
                <Award className="w-7 h-7 text-amber-300" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-amber-200">100% Authentic</p>
                  <p className="text-xs font-extrabold">Handmade in SL</p>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Right: Story copy & 3-Step Process ---- */}
          <div className="lg:col-span-6 flex flex-col gap-8">
            <div>
              <div className="inline-flex items-center gap-2 text-brand-terracotta text-xs font-bold tracking-widest uppercase mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Our Heart &amp; Craft</span>
              </div>
              <h2
                id="story-heading"
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-brown tracking-tight leading-tight"
              >
                From Our Hands to Your Sanctuary
              </h2>
              <p className="text-sm sm:text-base text-brand-stone mt-4 leading-relaxed">
                At Flamira, we believe home is where tranquility begins. Born from a love for natural botanicals and mindful living, every candle and keepsake is poured by hand in small batches to bring warmth, comforting aromas, and luxury aesthetics to your spaces.
              </p>
            </div>

            {/* 3 Step Visual Progression */}
            <div className="space-y-4">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="group flex items-start gap-4 p-4 rounded-2xl bg-brand-cream/60 border border-brand-border/60 hover:bg-white hover:border-brand-terracotta/40 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-brand-border/80 shadow-sm text-brand-terracotta group-hover:bg-brand-terracotta group-hover:text-white transition-all">
                    {step.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-brand-terracotta">
                        {step.step}
                      </span>
                      <h3 className="font-serif text-base font-bold text-brand-brown">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-xs text-brand-stone mt-1 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-brand-border">
              {STATS.map((stat, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-brand-terracotta">
                    {stat.value}
                  </span>
                  <span className="text-[11px] font-medium text-brand-stone mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Read About Us Button */}
            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-terracotta hover:text-brand-terracotta-dark transition-colors"
              >
                <span>Read Our Full Artisan Story</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
