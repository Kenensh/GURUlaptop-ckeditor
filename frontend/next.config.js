/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // 確保靜態資源正確加載
  assetPrefix: '',
  trailingSlash: false,
  
  // 優化構建設置
  compress: true,
  poweredByHeader: false,
  
  // 快速啟動設置
  experimental: {
    // 減少構建時間
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
    // 生產環境優化
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          common: {
            minChunks: 2,
            chunks: 'all',
            name: 'common',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          }
        }
      }
    }
    return config
  },
}

module.exports = nextConfig
