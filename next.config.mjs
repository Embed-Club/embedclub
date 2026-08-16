import { withPayload } from '@payloadcms/next/withPayload'

/**
 * Media CDN host, taken from the same env var the app serves uploads from, so
 * the bucket is configured per environment rather than baked into the repo.
 *
 * Unset is a supported state, not an error: `lib/mediaUrl.ts` only rewrites
 * upload URLs to the CDN when that variable is present, and leaves them as
 * relative `/api/<collection>/file/…` paths otherwise. No variable means no
 * Supabase URLs are ever emitted, so there is nothing for `next/image` to
 * allow — omitting the pattern is exactly right. A malformed value is a
 * genuine misconfiguration and still fails loudly.
 */
function resolveMediaHost() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_URL
  if (!raw) return undefined

  try {
    return new URL(raw).hostname
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_MEDIA_URL is not a valid URL: ${raw}`)
  }
}

const supabaseMediaHost = resolveMediaHost()

/**
 * Response headers applied to every route.
 *
 * No CSP yet — the admin is a large third-party bundle and one written blind
 * would break it. These four are the ones that carry no such risk.
 */
const securityHeaders = [
  // Stop the browser from second-guessing a declared Content-Type. Matters most
  // for user uploads, which are served from storage under an admin's say-so.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // No framing, so the admin cannot be clickjacked.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Features the site never uses; deny them outright.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Version banner is free reconnaissance.
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  // Your Next.js config here
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(supabaseMediaHost ? [{ protocol: 'https', hostname: supabaseMediaHost }] : []),
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  // Allow dev-server requests proxied through a tunnel (ngrok / Tailscale Funnel).
  allowedDevOrigins: [
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
    '*.ngrok.app',
    '*.ngrok.io',
    '*.ts.net',
  ],
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion'],
  },
  serverExternalPackages: ['payload', 'shiki'],
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, {
  configPath: './src/payload/payload.config.ts',
  devBundleServerPackages: false,
})
