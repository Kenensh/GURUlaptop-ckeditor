const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  compiler: {
    styledComponents: true,
  },
  assetPrefix:
    process.env.NODE_ENV === 'production'
      ? 'https://gurulaptop-ckeditor-frontend.onrender.com'
      : '',
  basePath: '',
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
    if (!dev && isServer) {
      config.devtool = 'source-map'
    }
    if (!isServer) {
      config.output.publicPath =
        process.env.NODE_ENV === 'production'
          ? 'https://gurulaptop-ckeditor-frontend.onrender.com/_next/'
          : '/_next/'
    }
    return config
  },
  async redirects() {
    return [
      {
        source: '/chatroom',
        destination: '/chat',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
