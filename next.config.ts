import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.wear2.jp",
      },
      {
        protocol: "https",
        hostname: "cdn.wimg.jp",
      },
      {
        protocol: "https",
        hostname: "grimoire-jp.com",
      },
    ],
  },
  headers: async () => [
    {
      source: "/:path*.webp",
      headers: [
        { key: "Cache-Control", value: "public, max-age=2592000, immutable" },
      ],
    },
    {
      source: "/:path*.woff2",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
