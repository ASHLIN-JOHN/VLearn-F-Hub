/** @type {import('next').NextConfig} */
const nextConfig = {

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [],
  allowedDevOrigins: [
    'localhost:5000',
    '127.0.0.1:5000',
    '127.0.0.1',
    'localhost',
    '5d791b0a-4f0c-433d-8a54-4997175bd68d-00-2ruw552m9mpw6.pike.replit.dev',
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

export default nextConfig