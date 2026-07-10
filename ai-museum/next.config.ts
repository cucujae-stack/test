import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder artworks are generated as local SVGs (scripts/generate-art.mjs).
    // When Supabase Storage is connected, its public bucket host is allowed below.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
