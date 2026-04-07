import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sccourier.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:     '/',
        disallow:  ['/admin/', '/api/', '/_next/'],
      },
      {
        // Block AI training crawlers
        userAgent: ['GPTBot', 'CCBot', 'anthropic-ai', 'Google-Extended'],
        disallow:  '/',
      },
    ],
    sitemap:    `${APP_URL}/sitemap.xml`,
    host:       APP_URL,
  };
}
