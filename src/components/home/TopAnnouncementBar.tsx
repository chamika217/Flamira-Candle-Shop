"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Truck, Heart, Gift, X } from "lucide-react";

export default function TopAnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const items = [
    { icon: <Sparkles className="w-3.5 h-3.5 text-amber-300" />, text: "100% Handcrafted Artisan Soy Candles & Keepsakes" },
    { icon: <Truck className="w-3.5 h-3.5 text-amber-300" />, text: "Island-Wide Delivery • Cash on Delivery (COD) Available" },
    { icon: <Gift className="w-3.5 h-3.5 text-amber-300" />, text: "Custom Gift Boxes & Wedding Favors Crafted with Love" },
    { icon: <Heart className="w-3.5 h-3.5 text-amber-300" />, text: "Made with Heart in Sri Lanka • Clean & Eco-Friendly" },
  ];

  return (
    <div className="relative bg-gradient-to-r from-brand-brown via-[#542d1b] to-brand-brown text-amber-100 text-xs py-2 px-4 overflow-hidden border-b border-brand-terracotta/20 z-40 select-none shadow-inner">
      <div className="flex items-center justify-between max-w-7xl mx-auto relative">
        
        {/* Infinite Marquee Strip */}
        <div className="overflow-hidden w-full flex items-center">
          <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
            {/* Repeated twice for seamless looping */}
            {[...items, ...items].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 font-medium tracking-wide">
                <span className="shrink-0">{item.icon}</span>
                <span>{item.text}</span>
                <span className="text-amber-400/40 text-xs font-mono ml-4">•</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Code Pill & Dismiss */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 pl-6 border-l border-amber-200/20">
          <Link
            href="/custom"
            className="text-[11px] font-semibold bg-amber-400/20 text-amber-200 px-2.5 py-0.5 rounded-full hover:bg-amber-400/30 transition-colors border border-amber-300/30"
          >
            Custom Orders Available ✨
          </Link>
          <button
            onClick={() => setVisible(false)}
            className="text-amber-200/60 hover:text-amber-100 p-0.5 rounded transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
