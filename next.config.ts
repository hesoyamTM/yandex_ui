import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: `/api/:path*`,
        destination: `http://26.57.252.134:1323/:path*`,
      },
    ]
  }
};

export default nextConfig;
