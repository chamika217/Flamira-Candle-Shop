"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";

interface WishlistContextValue {
  wishlist: string[]; // productIds
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const KEY = "flamira_wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    try { setWishlist(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(wishlist)); } catch { /* ignore */ }
  }, [wishlist]);

  const toggle = useCallback((id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const isWishlisted = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const value = useMemo(() => ({ wishlist, toggle, isWishlisted }), [wishlist, toggle, isWishlisted]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
