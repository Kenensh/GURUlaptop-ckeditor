const path = require('path') // 添加這行在最上方

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
  // webpack 配置
  webpack: (config) => {
    config.resolve.alias['@components'] = path.join(__dirname, 'components')
    return config
  },
  // redirects 配置
  async redirects() {
    return [
      {
        source: '/chatroom',
        destination: '/chat',
        permanent: true,
      },
    ]
  },
  // 添加 swc 配置
  swcMinify: false,
  // eslint 配置（如果還有問題可以啟用）
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
}

module.exports = nextConfig
