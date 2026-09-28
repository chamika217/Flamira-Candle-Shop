"use client";

/**
 * HeroPhotoShuffle
 * Polaroid-stack photo shuffle — pure CSS transitions, no framer-motion needed.
 * Respects prefers-reduced-motion: static single image when motion is reduced.
 * Pauses on hover / touch.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

// ---- Photos ----------------------------------------------------------------
const PHOTOS = [
  "/Animation1.png",
  "/Animation2.png",
  "/Animation3.png",
  "/Animation4.png",
  "/Animation5.png",
  "/Animation6.png",
  "/Animation7.png",
] as const;

// ---- Stack config ----------------------------------------------------------
// The cards behind the top card get these transforms (index 0 = directly behind top)
const BEHIND_TRANSFORMS = [
  "rotate(-6deg) scale(0.93) translateY(6px)",
  "rotate(5deg)  scale(0.90) translateY(10px)",
  "rotate(-9deg) scale(0.87) translateY(14px)",
  "rotate(7deg)  scale(0.84) translateY(18px)",
  "rotate(-4deg) scale(0.81) translateY(22px)",
  "rotate(10deg) scale(0.78) translateY(26px)",
];

// Fly-out direction alternates left / right for variety
const EXIT_TRANSFORMS = [
  "rotate(-25deg) translateX(-140%) translateY(-20%)",
  "rotate(25deg)  translateX(140%)  translateY(-20%)",
];

const CYCLE_MS = 2600;

// ---- Component -------------------------------------------------------------

export default function HeroPhotoShuffle() {
  const [order, setOrder]       = useState<number[]>(PHOTOS.map((_, i) => i));
  const [exiting, setExiting]   = useState<number | null>(null);
  const [exitDir, setExitDir]   = useState(0);
  const [reduced, setReduced]   = useState(false);
  const [paused, setPaused]     = useState(false);
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitCount               = useRef(0);

  // Detect prefers-reduced-motion once on mount
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
      // After the exit animation finishes, clear exiting and push top to back
      setTimeout(() => {
        setExiting(null);
        setOrder([...rest, top]);
      }, 550); // matches transition duration below
      return prev; // keep prev until timeout re-sets
    });
  }, []);

  // Auto-cycle
  useEffect(() => {
    if (reduced || paused) return;
    timerRef.current = setInterval(advance, CYCLE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [reduced, paused, advance]);

  // Reduced motion — just show first photo statically
  if (reduced) {
    return (
      <div className="relative w-[280px] h-[340px] sm:w-[320px] sm:h-[390px] lg:w-[360px] lg:h-[440px] mx-auto">
        <div className="absolute inset-0 bg-brand-white rounded-2xl shadow-xl p-3">
          <div className="relative w-full h-full rounded-lg overflow-hidden">
            <Image src={PHOTOS[0]} alt="Flamira handmade candles" fill className="object-cover" sizes="360px" priority />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-[280px] h-[340px] sm:w-[320px] sm:h-[390px] lg:w-[360px] lg:h-[440px] mx-auto select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => { setPaused(false); }}
      aria-label="Product photo gallery"
      role="img"
    >
      {/* Render from bottom of stack (last) to top (first) so top card is painted last */}
      {[...order].reverse().map((photoIdx, reversedPos) => {
        const stackPos = order.length - 1 - reversedPos; // 0 = top card
        const isTop    = stackPos === 0;
        const isExiting = exiting === photoIdx;

        let transform: string;
        let opacity: number;
        let zIndex: number;

        if (isExiting) {
          transform = EXIT_TRANSFORMS[exitDir];
          opacity   = 0;
          zIndex    = 20;
        } else if (isTop) {
          transform = "rotate(0deg) scale(1) translateY(0px)";
          opacity   = 1;
          zIndex    = 10;
        } else {
          const behindIdx = stackPos - 1; // 0-indexed behind position
          transform = BEHIND_TRANSFORMS[Math.min(behindIdx, BEHIND_TRANSFORMS.length - 1)];
          opacity   = Math.max(0.35, 1 - behindIdx * 0.15);
          zIndex    = 10 - stackPos;
        }

        return (
          <div
            key={photoIdx}
            style={{
              position:   "absolute",
              inset:      0,
              transform,
              opacity,
              zIndex,
              transition: isExiting
                ? "transform 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.55s ease"
                : isTop
                ? "transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease"
                : "transform 0.55s ease, opacity 0.4s ease",
              transformOrigin: "center bottom",
            }}
            aria-hidden={!isTop}
          >
            {/* Polaroid frame */}
            <div
              className="absolute inset-0 rounded-2xl shadow-2xl"
              style={{ background: "#fffdf9", padding: "10px 10px 28px 10px" }}
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src={PHOTOS[photoIdx]}
                  alt={`Flamira product ${photoIdx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 360px"
                  priority={photoIdx === 0}
                  draggable={false}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
