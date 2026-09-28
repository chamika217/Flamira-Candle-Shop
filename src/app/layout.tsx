import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import StorefrontShell from "@/components/StorefrontShell";

// Playfair Display — serif, used for logo, headings, and display text
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// Inter — clean sans-serif for body copy and UI
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// ---------------------------------------------------------------------------
// Root metadata — shared across all pages unless overridden per-page
// ---------------------------------------------------------------------------

const TITLE       = "Flamira — Handmade Home Décor & Gifts";
const DESCRIPTION = "Handcrafted home décor and gifts from Sri Lanka, delivered island-wide.";

export const metadata: Metadata = {
  title:       TITLE,
  description: DESCRIPTION,
  keywords: [
    "home decor Sri Lanka",
    "online gift shop Sri Lanka",
    "handmade gifts Sri Lanka",
    "personalized gifts Sri Lanka",
    "resin art Sri Lanka",
    "gift box delivery Sri Lanka",
    "Flamira",
    "Flamira Sri Lanka",
    "soy wax candles Sri Lanka",
    "handpoured candles Sri Lanka",
  ],
  openGraph: {
    title:       TITLE,
    description: DESCRIPTION,
    type:        "website",
    locale:      "en_LK",
    siteName:    "Flamira",
  },
  twitter: {
    card:        "summary_large_image",
    title:       TITLE,
    description: DESCRIPTION,
  },
};

// ---------------------------------------------------------------------------
// Pixel IDs — read once at module level (server-side safe)
// These Script blocks are only rendered when the env var is set and non-empty.
// They are completely inert until real IDs are added to .env.local:
//   NEXT_PUBLIC_META_PIXEL_ID
//   NEXT_PUBLIC_TIKTOK_PIXEL_ID
//   NEXT_PUBLIC_GA4_ID
// ---------------------------------------------------------------------------

const META_PIXEL_ID   = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const GA4_ID          = process.env.NEXT_PUBLIC_GA4_ID;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-brand-cream text-brand-brown font-sans">
        <StorefrontShell>{children}</StorefrontShell>

        {/* ----------------------------------------------------------------
            Google Analytics 4
            Only rendered when NEXT_PUBLIC_GA4_ID is set.
        ---------------------------------------------------------------- */}
        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_ID}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        )}

        {/* ----------------------------------------------------------------
            Meta (Facebook) Pixel
            Only rendered when NEXT_PUBLIC_META_PIXEL_ID is set.
        ---------------------------------------------------------------- */}
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

        {/* ----------------------------------------------------------------
            TikTok Pixel
            Only rendered when NEXT_PUBLIC_TIKTOK_PIXEL_ID is set.
        ---------------------------------------------------------------- */}
        {TIKTOK_PIXEL_ID && (
          <Script id="tiktok-pixel" strategy="afterInteractive">
            {`
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
                ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],
                ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
                ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
                var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
                var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${TIKTOK_PIXEL_ID}');
                ttq.page();
              }(window, document, 'ttq');
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
