const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // 加入資產前綴配置
  assetPrefix:
    process.env.NODE_ENV === 'production'
      ? 'https://gurulaptop-ckeditor-frontend.onrender.com'
      : '',
  // 加入公共路徑配置
  basePath: '',
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
    // 加入公共路徑配置
    if (!isServer) {
      config.output.publicPath =
        process.env.NODE_ENV === 'production'
          ? 'https://gurulaptop-ckeditor-frontend.onrender.com/_next/'
          : '/_next/'
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
