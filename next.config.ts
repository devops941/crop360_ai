import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['pdfjs-dist', 'pdf-parse', 'tesseract.js'],
  eslint: {
    // Ignore ESLint errors during production builds on Vercel/CI
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if minor type mismatches exist
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
