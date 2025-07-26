/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: false,
  // 簡化 experimental 設定
  experimental: {
    esmExternals: false,
  },
  compiler: {
    styledComponents: true,
  },
  // 移除 assetPrefix 避免開發環境問題
  // assetPrefix:
  //   process.env.NODE_ENV === 'production'
  //     ? 'https://gurulaptop-ckeditor-frontend.onrender.com'
  //     : '',
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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // SCSS 配置來抑制警告
  sassOptions: {
    quietDeps: true,
    silenceDeprecations: ['legacy-js-api', 'color-functions', 'global-builtin', 'import'],
  },
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    
    // 抑制 SCSS deprecation 警告
    config.module.rules.forEach((rule) => {
      if (rule.test && rule.test.toString().includes('scss')) {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach((use) => {
            if (use.loader && use.loader.includes('sass-loader')) {
              use.options = use.options || {}
              use.options.sassOptions = use.options.sassOptions || {}
              use.options.sassOptions.quietDeps = true
              use.options.sassOptions.silenceDeprecations = ['legacy-js-api', 'color-functions', 'global-builtin', 'import']
            }
          })
        }
      }
    })
    
    // 簡化 publicPath 設定，僅在生產環境使用
    // if (!isServer && process.env.NODE_ENV === 'production') {
    //   config.output.publicPath = 'https://gurulaptop-ckeditor-frontend.onrender.com/_next/'
    // }
    
    return config
  },
}

module.exports = nextConfig
