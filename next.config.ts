import type { NextConfig } from "next";

// Disable TLS certificate verification in development only.
// Fixes "unable to verify the first certificate" errors when Firestore
// SDK runs server-side through Node.js with a corporate proxy or VPN.
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
