/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // 基本設置
  assetPrefix: '',
  trailingSlash: false,
  compress: true,
  poweredByHeader: false,
  
  // 關閉可能導致問題的功能
  experimental: {
    // 完全關閉實驗性功能
  },
  
  // 圖片設置
  images: {
    domains: ['localhost', 'via.placeholder.com', 'gurulaptop-ckeditor.onrender.com'],
    unoptimized: true,
  },
  
  // 忽略錯誤
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 環境變數
  env: {
    BACKEND_URL: process.env.NODE_ENV === 'production' 
      ? 'https://gurulaptop-ckeditor.onrender.com'
      : 'http://localhost:3005',
  },
  
  // 簡化的 webpack 配置 - 禁用複雜的 code splitting
  webpack: (config, { dev, isServer }) => {
    // 只在生產環境進行最基本的優化
    if (!dev && !isServer) {
      // 禁用複雜的 splitChunks 設置
      config.optimization.splitChunks = false
      
      // 簡化模組解析
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // 輸出設置
  output: 'standalone',
  
  // 禁用 SWC minification，使用 Terser
  swcMinify: false,
}

module.exports = nextConfig
