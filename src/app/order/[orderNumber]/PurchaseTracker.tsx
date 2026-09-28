"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/lib/pixels";

interface Props {
  orderNumber: string;
  total: number;
  items: { productId: string; qty: number }[];
}

/**
 * Invisible client component that fires trackPurchase exactly once when the
 * order confirmation page mounts. A useRef flag prevents double-firing on
 * React StrictMode re-renders or route refreshes.
 */
export default function PurchaseTracker({ orderNumber, total, items }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPurchase({ orderNumber, total, items });
  }, [orderNumber, total, items]);

  return null;
}
