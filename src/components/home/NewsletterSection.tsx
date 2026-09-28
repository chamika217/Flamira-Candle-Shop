"use client";

import { useState } from "react";
import { Mail, Sparkles, Check, ArrowRight, Gift } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubmitted(true);
  };

  return (
    <section className="relative py-16 sm:py-24 bg-white border-t border-brand-border/60 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-0 right-1/4 w-72 h-72 rounded-full bg-brand-terracotta/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Container Box */}
        <div className="p-8 sm:p-14 rounded-3xl sm:rounded-[36px] bg-gradient-to-b from-brand-ivory/80 via-brand-cream to-brand-ivory border border-brand-border/80 shadow-xl relative overflow-hidden">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-terracotta/10 text-brand-terracotta text-xs font-bold uppercase tracking-wider mb-4 border border-brand-terracotta/20">
            <Gift className="w-3.5 h-3.5 text-brand-terracotta" />
            <span>Exclusive Welcome Gift</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-brown tracking-tight">
            Join the Flamira Family &amp; Get 10% Off
          </h2>

          <p className="text-sm sm:text-base text-brand-stone mt-3 max-w-lg mx-auto leading-relaxed">
            Subscribe to receive exclusive preview access to new seasonal candle drops, custom gifting inspiration, and private member discounts.
          </p>

          {/* Form */}
          {submitted ? (
            <div className="mt-8 p-6 rounded-2xl bg-white border border-emerald-500/30 shadow-lg max-w-md mx-auto animate-scale-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-brown">
                Welcome to Flamira! 🎉
              </h3>
              <p className="text-xs text-brand-stone mt-1">
                Your 10% discount code is ready to use at checkout:
              </p>
              <div className="mt-3 inline-block font-mono text-sm font-extrabold text-brand-terracotta bg-brand-ivory px-4 py-2 rounded-xl border border-brand-terracotta/30 select-all">
                FLAMIRA10
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
            >
              <div className="relative w-full">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-full bg-white border border-brand-border text-sm text-brand-brown placeholder:text-brand-muted/70 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40 focus:border-brand-terracotta shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-brand-terracotta hover:bg-brand-terracotta-dark text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
              >
                <span>Subscribe</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <p className="text-[11px] text-brand-muted mt-4">
            No spam, ever. Unsubscribe anytime with a single click.
          </p>
        </div>
      </div>
    </section>
  );
}
