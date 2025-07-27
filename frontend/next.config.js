/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // 確保靜態資源正確加載
  assetPrefix: '',
  trailingSlash: false,
  
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
  webpack: (config) => {
    return config
  },
}

module.exports = nextConfig
