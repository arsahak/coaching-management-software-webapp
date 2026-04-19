import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      // Add your own domains here instead of allowing all
      // Example:
      // {
      //   protocol: "https",
      //   hostname: "your-cdn-domain.com",
      // },
    ],
  },
  // Enable experimental features if needed
  experimental: {
    // Uncomment if you need these features
    // optimizePackageImports: ["recharts", "react-icons"],
  },
};

export default nextConfig;
