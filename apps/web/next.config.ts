import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Required for Docker deployment

  // Ensure the openapi package is included in the standalone build
  outputFileTracingRoot: '../../',
};

export default nextConfig;
