/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: false,
  
  // 移除所有可能導致問題的實驗性功能
  experimental: {},
  
  // 基本編譯器設定
  compiler: {
    styledComponents: true,
  },
  
  // 簡化圖片設定
  images: {
    domains: ['localhost', 'via.placeholder.com'],
    unoptimized: true,
  },
  
  // 忽略建置錯誤
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 最小化 webpack 設定
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
}

module.exports = nextConfig
