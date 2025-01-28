/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: false,
  // 加入這段
  experimental: {
    esmExternals: false,
  },
  compiler: {
    styledComponents: true,
  },
  assetPrefix:
    process.env.NODE_ENV === 'production'
      ? 'https://gurulaptop-ckeditor-frontend.onrender.com'
      : '',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    if (!isServer) {
      config.output.publicPath =
        process.env.NODE_ENV === 'production'
          ? 'https://gurulaptop-ckeditor-frontend.onrender.com/_next/'
          : '/_next/'
    }
    return config
  },
}

module.exports = nextConfig
