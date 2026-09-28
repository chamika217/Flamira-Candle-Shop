"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sparkles, Star, Flame, Award } from "lucide-react";

const PHOTOS = [
  { src: "/Animation1.png", title: "Hand-poured Botanical Candle", tag: "Best Seller" },
  { src: "/Animation2.png", title: "Aromatherapy Wax Tablets", tag: "Artisan Craft" },
  { src: "/Animation3.png", title: "Luxury Amber Jar Candles", tag: "Pure Soy Wax" },
  { src: "/Animation4.png", title: "Resin Keepsake Collection", tag: "Handmade" },
  { src: "/Animation5.png", title: "Signature Gift Hamper Box", tag: "Custom Gifting" },
  { src: "/Animation6.png", title: "Floral Wax Sachet Décor", tag: "Eco-Friendly" },
  { src: "/Animation7.png", title: "Minimalist Aesthetic Accents", tag: "Island-Wide" },
];

const BEHIND_TRANSFORMS = [
  "rotate(-5deg) scale(0.94) translateY(8px)",
  "rotate(6deg)  scale(0.89) translateY(16px)",
  "rotate(-8deg) scale(0.84) translateY(24px)",
  "rotate(7deg)  scale(0.80) translateY(32px)",
  "rotate(-3deg) scale(0.76) translateY(38px)",
  "rotate(9deg)  scale(0.72) translateY(44px)",
];

const EXIT_TRANSFORMS = [
  "rotate(-22deg) translateX(-135%) translateY(-15%) scale(0.9)",
  "rotate(22deg)  translateX(135%)  translateY(-15%) scale(0.9)",
];

const CYCLE_MS = 3200;

export default function HeroPhotoModern() {
  const [order, setOrder] = useState<number[]>(PHOTOS.map((_, i) => i));
  const [exiting, setExiting] = useState<number | null>(null);
  const [exitDir, setExitDir] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const exitCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const advance = useCallback(() => {
    setOrder((prev) => {
      if (prev.length <= 1) return prev;
      const [top, ...rest] = prev;
      setExiting(top);
      exitCount.current += 1;
      setExitDir(exitCount.current % 2);
      setTimeout(() => {
        setExiting(null);
        setOrder([...rest, top]);
        setProgress(0);
      }, 550);
      return prev;
    });
  }, []);

  const prevCard = useCallback(() => {
    setOrder((prev) => {
      if (prev.length <= 1) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, prev.length - 1);
      return [last, ...rest];
    });
    setProgress(0);
  }, []);

  // Progress ticker & auto cycle
  useEffect(() => {
    if (reduced || paused) return;
    const stepTime = 50;
    const stepIncrement = (stepTime / CYCLE_MS) * 100;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          advance();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, stepTime);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reduced, paused, advance]);

  const currentIdx = order[0] ?? 0;
  const currentPhoto = PHOTOS[currentIdx];

  return (
    <div
      className="relative flex flex-col items-center justify-center p-2 sm:p-4 group/stack select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Dynamic Ambient Backlight Glow */}
      <div className="absolute -inset-8 bg-gradient-to-tr from-brand-terracotta/25 via-amber-400/20 to-brand-terracotta-light/15 rounded-full blur-3xl opacity-70 group-hover/stack:opacity-95 transition-opacity duration-700 pointer-events-none" />

      {/* Floating Badge 1 - Top Right */}
      <div className="absolute -top-3 sm:-top-5 -right-2 sm:-right-6 z-30 animate-float-slow hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-white/80">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
          <Flame className="w-4 h-4 text-brand-terracotta fill-brand-terracotta" />
        </span>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-medium text-brand-muted uppercase tracking-wider">Purity</span>
          <span className="text-xs font-bold text-brand-brown">100% Pure Soy</span>
        </div>
      </div>

      {/* Floating Badge 2 - Bottom Left */}
      <div className="absolute -bottom-4 sm:-bottom-5 -left-3 sm:-left-7 z-30 animate-float-reverse flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/80">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-terracotta/10 text-brand-terracotta">
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
        </span>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-brand-brown">4.9 / 5.0</span>
            <span className="text-[10px] text-amber-500">★★★★★</span>
          </div>
          <span className="text-[10px] font-medium text-brand-stone">500+ Happy Homes</span>
        </div>
      </div>

      {/* Floating Badge 3 - Top Left Mini */}
      <div className="absolute top-12 -left-4 z-30 hidden md:flex items-center gap-1.5 bg-brand-brown/90 text-brand-ivory backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-white/10 text-[11px] font-medium animate-pulse-glow">
        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        <span>Island-Wide COD</span>
      </div>

      {/* Polaroid Deck Container */}
      <div className="relative w-[280px] h-[350px] sm:w-[330px] sm:h-[410px] lg:w-[370px] lg:h-[460px]">
        {/* Render from bottom to top */}
        {[...order].reverse().map((photoIdx, reversedPos) => {
          const stackPos = order.length - 1 - reversedPos; // 0 = top card
          const isTop = stackPos === 0;
          const isExiting = exiting === photoIdx;

          let transform: string;
          let opacity: number;
          let zIndex: number;

          if (isExiting) {
            transform = EXIT_TRANSFORMS[exitDir];
            opacity = 0;
            zIndex = 25;
          } else if (isTop) {
            transform = "rotate(0deg) scale(1) translateY(0px)";
            opacity = 1;
            zIndex = 20;
          } else {
            const behindIdx = stackPos - 1;
            transform = BEHIND_TRANSFORMS[Math.min(behindIdx, BEHIND_TRANSFORMS.length - 1)];
            opacity = Math.max(0.4, 1 - behindIdx * 0.15);
            zIndex = 15 - stackPos;
          }

          return (
            <div
              key={photoIdx}
              style={{
                position: "absolute",
                inset: 0,
                transform,
                opacity,
                zIndex,
                transition: isExiting
                  ? "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.55s ease"
                  : isTop
                  ? "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease"
                  : "transform 0.55s ease, opacity 0.4s ease",
                transformOrigin: "center bottom",
              }}
              aria-hidden={!isTop}
            >
              {/* Premium Polaroid Card Shell */}
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-b from-[#fffefc] to-[#fbf7f1] p-3 sm:p-3.5 pb-8 sm:pb-9 shadow-[0_20px_50px_rgba(61,32,18,0.18)] border border-white/90 overflow-hidden flex flex-col">
                
                {/* Photo Area */}
                <div className="relative w-full flex-1 rounded-2xl overflow-hidden bg-brand-ivory shadow-inner">
                  <Image
                    src={PHOTOS[photoIdx].src}
                    alt={PHOTOS[photoIdx].title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover/stack:scale-105"
                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 330px, 370px"
                    priority={photoIdx === 0}
                    draggable={false}
                  />

                  {/* Gradient Lighting overlay on photo */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

                  {/* Category / Collection Tag */}
                  <div className="absolute top-3 left-3 bg-brand-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-brand-brown uppercase tracking-wider shadow-sm flex items-center gap-1 border border-white/60">
                    <Award className="w-3 h-3 text-brand-terracotta" />
                    <span>{PHOTOS[photoIdx].tag}</span>
                  </div>
                </div>

                {/* Polaroid Caption Area */}
                <div className="pt-3 px-1 flex items-center justify-between">
                  <div>
                    <p className="font-serif text-sm sm:text-base font-semibold text-brand-brown leading-tight truncate">
                      {PHOTOS[photoIdx].title}
                    </p>
                    <p className="text-[11px] text-brand-muted font-medium mt-0.5">
                      Handcrafted in Sri Lanka
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-brand-terracotta bg-brand-terracotta/10 px-2 py-0.5 rounded-full font-semibold">
                    0{photoIdx + 1}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Controls & Progress Indicators */}
      <div className="flex items-center gap-4 mt-6 z-30">
        {/* Prev button */}
        <button
          onClick={prevCard}
          className="h-9 w-9 rounded-full bg-white/90 text-brand-brown hover:bg-brand-terracotta hover:text-white shadow-md border border-brand-border/60 flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Slide dots with active indicator */}
        <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-brand-border/40 shadow-sm">
          {PHOTOS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setOrder((prev) => {
                  const targetIdx = prev.indexOf(i);
                  if (targetIdx <= 0) return prev;
                  return [...prev.slice(targetIdx), ...prev.slice(0, targetIdx)];
                });
                setProgress(0);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIdx === i
                  ? "w-6 bg-brand-terracotta"
                  : "w-2 bg-brand-border hover:bg-brand-stone"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={advance}
          className="h-9 w-9 rounded-full bg-white/90 text-brand-brown hover:bg-brand-terracotta hover:text-white shadow-md border border-brand-border/60 flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="Next photo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Auto cycle subtle progress bar */}
      <div className="w-36 h-1 bg-brand-border/40 rounded-full mt-2 overflow-hidden">
        <div
          className="h-full bg-brand-terracotta/70 rounded-full transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
