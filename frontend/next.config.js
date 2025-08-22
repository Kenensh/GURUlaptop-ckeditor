/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // 確保靜態資源正確加載
  assetPrefix: '',
  trailingSlash: false,
  
  // 優化構建設置
  compress: true,
  poweredByHeader: false,
  
  // 禁用可能導致問題的實驗性功能
  experimental: {
    esmExternals: false,
    forceSwcTransforms: false,
  },
  
  images: {
    domains: ['localhost', 'via.placeholder.com', 'gurulaptop-ckeditor.onrender.com'],
    unoptimized: true,
  },
  
  // 忽略建置錯誤
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 環境變數設定
  env: {
    BACKEND_URL: process.env.NODE_ENV === 'production' 
      ? 'https://gurulaptop-ckeditor.onrender.com'
      : 'http://localhost:3005',
  },
  
  // 最小化 webpack 設定
  webpack: (config, { dev, isServer }) => {
    // 簡化生產環境設定，避免 splitChunks 問題
    if (!dev && !isServer) {
      // 使用預設的 splitChunks 設定
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all'
          }
        }
      }
    }
    return config
  },
}

module.exports = nextConfig
