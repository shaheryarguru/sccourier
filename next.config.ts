import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Cloudflare Images CDN — delivery proof, signatures, package photos
        protocol: 'https',
        hostname: 'imagedelivery.net',
        pathname: '/**',
      },
      {
        // Cloudflare R2 / custom domain variant
        protocol: 'https',
        hostname: '*.cloudflareimages.com',
        pathname: '/**',
      },
      {
        // Supabase Storage — company logo and other assets
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Serve images at device pixel ratios 1x and 2x
    deviceSizes: [375, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Standalone output — required for Hostinger Node.js and self-hosted deployments
  output: 'standalone',

  // Allow production source maps for error tracking (Sentry etc.)
  // productionBrowserSourceMaps: true,

  // /_next/static is cache-controlled by Next.js automatically — no override needed.
  // Only add long-lived cache for self-hosted font files in /public/fonts.
  async headers() {
    return [
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
