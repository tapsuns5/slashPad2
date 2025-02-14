import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        // Add any specific Turbopack rules if needed
      }
    }
  }
};

export default nextConfig;
