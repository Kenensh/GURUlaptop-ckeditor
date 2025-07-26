/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: false,
  
  // 基本實驗性功能
  experimental: {
    esmExternals: false,
  },
  
  // 編譯器設定
  compiler: {
    styledComponents: true,
  },
  
  // 圖片設定
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
        hostname: 'localhost',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },
  
  // SASS 設定
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: ['legacy-js-api'],
  },
  
  // Webpack 設定
  webpack: (config, { isServer, dev }) => {
    // 路徑別名
    config.resolve.alias['@'] = path.resolve(__dirname)
    
    // SCSS 警告抑制
    config.module.rules.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('scss')) {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach((use) => {
            if (use.loader && use.loader.includes('sass-loader')) {
              use.options = use.options || {}
              use.options.sassOptions = {
                quietDeps: true,
                silenceDeprecations: ['legacy-js-api', 'color-functions'],
              }
            }
          })
        }
      }
    })
    
    return config
  },
}

module.exports = nextConfig
