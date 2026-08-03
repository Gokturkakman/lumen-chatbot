import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    // Tool calls (YouTube video analysis in particular) can run long.
    proxyTimeout: 120_000,
  },
};

export default nextConfig;
