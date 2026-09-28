"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { ShoppingBag, User, Menu, X, Sparkles } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Custom Orders", href: "/custom", badge: "Hot" },
  { label: "Contact", href: "/contact" },
] as const;

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { user, profile } = useCustomerAuth();

  const firstName = profile?.name?.split(" ")[0] ?? null;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-brand-border/80 transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          
          {/* ---- Logo & Brand Title ---- */}
          <Link
            href="/"
            className="group flex items-center gap-3 shrink-0"
            aria-label="Flamira — go to homepage"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="relative">
              <img
                src="/flamira-logo.png"
                alt="Flamira"
                className="h-10 w-10 sm:h-11 sm:w-11 object-cover rounded-full border-2 border-brand-terracotta/20 group-hover:border-brand-terracotta transition-colors shadow-sm"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div className="flex flex-col">
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-brand-brown group-hover:text-brand-terracotta transition-colors">
                Flamira
              </span>
              <span className="text-[10px] tracking-widest text-brand-muted uppercase font-medium -mt-1 hidden sm:block">
                Handmade in Ceylon
              </span>
            </div>
          </Link>

          {/* ---- Desktop Navigation ---- */}
          <nav
            className="hidden md:flex items-center gap-8"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "relative text-sm font-medium tracking-wide transition-all duration-200 py-1 flex items-center gap-1.5",
                    isActive
                      ? "text-brand-terracotta font-semibold"
                      : "text-brand-stone hover:text-brand-terracotta",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span>{link.label}</span>
                  {"badge" in link && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-terracotta rounded-full animate-scale-in" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ---- Right Actions ---- */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Account Link */}
            <Link
              href={user ? "/account" : "/account/login"}
              className="flex items-center gap-2 text-brand-brown hover:text-brand-terracotta transition-colors p-2 rounded-full hover:bg-brand-ivory/80"
              aria-label={user ? "My account" : "Sign in"}
            >
              <User className="w-5 h-5" />
              {user && firstName && (
                <span className="text-xs font-semibold text-brand-stone hidden lg:block">
                  {firstName}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center p-2 rounded-full text-brand-brown hover:text-brand-terracotta hover:bg-brand-ivory/80 transition-colors"
              aria-label={`Cart${totalItems > 0 ? `, ${totalItems} item${totalItems !== 1 ? "s" : ""}` : ", empty"}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[19px] h-[19px] flex items-center justify-center rounded-full bg-brand-terracotta text-white text-[10px] font-bold px-1 leading-none shadow-sm animate-scale-in"
                  aria-hidden="true"
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="md:hidden text-brand-brown hover:text-brand-terracotta p-2 rounded-lg transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Mobile Nav Drawer ---- */}
      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-brand-border bg-white/95 backdrop-blur-xl px-4 py-4 animate-scale-in shadow-xl"
        >
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={[
                      "flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium tracking-wide transition-all",
                      isActive
                        ? "bg-brand-terracotta/10 text-brand-terracotta font-semibold"
                        : "text-brand-stone hover:bg-brand-ivory/60 hover:text-brand-brown",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span>{link.label}</span>
                    {"badge" in link && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
