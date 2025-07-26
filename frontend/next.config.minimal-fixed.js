/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // 完全移除 experimental 和 assetPrefix 設定
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
  
  // 最小化 webpack 設定
  webpack: (config) => {
    return config
  },
}

module.exports = nextConfig
