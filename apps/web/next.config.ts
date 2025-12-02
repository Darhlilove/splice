import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Config for production deployment
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
