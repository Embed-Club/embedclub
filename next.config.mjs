import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase public Storage CDN (media bucket) — see NEXT_PUBLIC_SUPABASE_MEDIA_URL.
      { protocol: 'https', hostname: 'cgdncgvnqisrzsasuxfz.supabase.co' },
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
