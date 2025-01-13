const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // 加入錯誤追蹤
  onError: (err) => {
    console.error('Next.js Build Error:', err)
  },
  // images 設定保持不變
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
  // 處理建構時的檢查
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // webpack 配置增加 source-map
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    if (!dev && isServer) {
      config.devtool = 'source-map'
    }
    return config
  },
  // redirects 配置保持不變
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
