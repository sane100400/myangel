import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
