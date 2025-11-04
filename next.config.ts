import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/anywhere/:path*',
        destination: 'https://aliancacvtest.rtcom.pt/anywhere/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aliancacvtest.rtcom.pt',
      },
    ],
  },
};

export default nextConfig;
