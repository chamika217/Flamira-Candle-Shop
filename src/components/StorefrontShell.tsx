"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/context/CartContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { ReactNode } from "react";

/**
 * Wraps storefront pages with CustomerAuthProvider + CartProvider + Navbar + Footer.
 * Renders nothing extra for /admin/** routes so the admin panel
 * can display its own sidebar layout without storefront chrome.
 */
export default function StorefrontShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CustomerAuthProvider>
      <CartProvider>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
