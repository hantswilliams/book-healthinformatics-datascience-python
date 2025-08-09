import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Temporarily ignore TypeScript errors during builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors during builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
