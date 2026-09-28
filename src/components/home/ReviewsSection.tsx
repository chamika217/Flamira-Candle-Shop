"use client";

import { Star, CheckCircle2, Heart, Sparkles, Quote } from "lucide-react";

const REVIEWS = [
  {
    id: 1,
    name: "Sanduni Perera",
    location: "Colombo 07",
    item: "Vanilla & Sandalwood Amber Candle",
    rating: 5,
    comment: "The scent is pure luxury! It completely fills my living room without causing any headache. The aesthetic amber jar looks gorgeous on my coffee table.",
    date: "2 days ago",
  },
  {
    id: 2,
    name: "Dinuka Fernando",
    location: "Kandy",
    item: "Luxe Celebration Gift Hamper",
    rating: 5,
    comment: "Ordered a custom bridesmaid gift box and the packaging blew me away. The handwritten note and wax seal made it feel so personal and high-end!",
    date: "1 week ago",
  },
  {
    id: 3,
    name: "Ananya Wickramasinghe",
    location: "Galle",
    item: "Botanical Floral Wax Sachets",
    rating: 5,
    comment: "I hung these inside my wardrobe and now my whole room smells heavenly every time I open the closet. Super fast Cash on Delivery too!",
    date: "2 weeks ago",
  },
  {
    id: 4,
    name: "Kavindu Jayasuriya",
    location: "Negombo",
    item: "Resin Floral Trinket Tray",
    rating: 5,
    comment: "Bought as an anniversary gift for my wife. The real dried flowers inside the resin look breathtaking. Truly authentic Sri Lankan craftsmanship.",
    date: "3 weeks ago",
  },
  {
    id: 5,
    name: "Tharushi De Silva",
    location: "Kurunegala",
    item: "Aromatherapy Soy Candle Set",
    rating: 5,
    comment: "Such a clean burn! No black smoke at all and the lavender aroma is so soothing after a long work day. Will definitely order more.",
    date: "1 month ago",
  },
];

export default function ReviewsSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-brand-cream overflow-hidden border-t border-brand-border/60" aria-labelledby="reviews-heading">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-terracotta/5 rounded-full blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-brand-terracotta text-xs font-bold tracking-widest uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Love</span>
          </div>
          
          <h2
            id="reviews-heading"
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-brown tracking-tight"
          >
            Loved in 500+ Homes Across Sri Lanka
          </h2>

          {/* Rating Summary Pill */}
          <div className="flex items-center gap-3 mt-4 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-brand-border/80 shadow-sm">
            <div className="flex items-center text-amber-500 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <span className="font-bold text-sm text-brand-brown">4.9 / 5.0</span>
            <span className="text-xs text-brand-muted">• 500+ Verified Buyers</span>
          </div>
        </div>

        {/* Scrolling Testimonial Marquee Cards */}
        <div className="relative overflow-hidden py-4 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="animate-marquee flex items-center gap-6 whitespace-normal">
            {[...REVIEWS, ...REVIEWS].map((review, idx) => (
              <div
                key={idx}
                className="w-[310px] sm:w-[380px] shrink-0 p-6 sm:p-7 rounded-3xl bg-white border border-brand-border/80 shadow-sm hover:shadow-xl hover:border-brand-terracotta/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Stars + Quote Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-amber-500 gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <Quote className="w-5 h-5 text-brand-terracotta/20" />
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-brand-brown leading-relaxed font-normal italic">
                    &ldquo;{review.comment}&rdquo;
                  </p>
                </div>

                {/* Bottom Customer Info */}
                <div className="mt-6 pt-4 border-t border-brand-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-brand-terracotta/10 text-brand-terracotta font-bold text-xs flex items-center justify-center border border-brand-terracotta/20">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-brand-brown">{review.name}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] text-brand-muted">{review.location}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-brand-terracotta bg-brand-ivory px-2 py-0.5 rounded-full">
                    {review.item.split(" ")[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Endorsement */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-brand-stone font-medium">
          <span className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            100% Satisfaction Guarantee
          </span>
          <span>•</span>
          <span>Doorstep Replacement for Transit Damage</span>
          <span>•</span>
          <span>Handcrafted Fresh Daily</span>
        </div>
      </div>
    </section>
  );
}
