import { useEffect } from 'react'
import { useRouter } from 'next/router'

// 所有全域樣式
import '@/styles/globals.scss'
import '@/styles/product.scss'
import '@/styles/cart.scss'
import '@/styles/loader.scss'
import '@/styles/coupon.scss'
import '@/styles/header.scss'
import '@/styles/footer.scss'
import '@/styles/frontPage.scss'
import '@/styles/ArticleDetail.scss'
import '@/styles/ArticleHomePage.scss'
import '@/styles/BlogCreated.scss'
import '@/styles/BlogDetail.scss'
import '@/styles/BlogEdit.scss'
import '@/styles/BlogHomePage.scss'
import '@/styles/BlogUserOverview.scss'
import '@/styles/event.scss'
import '@/styles/eventDetail.scss'
import '@/styles/eventRegistration.scss'
import '@/styles/group.scss'
import '@/styles/groupCreat.scss'
import 'animate.css'

// 元件導入
import DefaultLayout from '@/components/layout/default-layout'

// Providers 導入
import { AuthProvider } from '@/hooks/use-auth'
import { LoadingProviderAnimation } from '@/context/LoadingContext'
import { GroupAuthProvider } from '@/context/GroupAuthContext'
import { CartProvider } from '@/hooks/use-cart-state'
import { LoaderProvider } from '@/hooks/use-loader'

// Loading 元件導入
import LoadingAnimation from '@/components/LoadingAnimation/LoadingAnimation'
import { LoadingSpinner } from '@/components/dashboard/loading-spinner'

// 常數定義
const isClient = typeof window !== 'undefined'
const BACKEND_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005'
    : 'https://gurulaptop-ckeditor.onrender.com'

// Fetch 攔截器設置
if (isClient) {
  const originalFetch = window.fetch
  window.fetch = async (url, options = {}) => {
    try {
      if (url.startsWith('/') || url.includes('gurulaptop-ckeditor')) {
        const finalUrl = url.startsWith('/') ? `${BACKEND_URL}${url}` : url

        if (options.method !== 'OPTIONS') {
          options = {
            ...options,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Cache-Control': 'no-store',
              ...options.headers,
            },
          }
        }

        return await originalFetch(finalUrl, options)
      }

      return originalFetch(url, options)
    } catch (error) {
      console.error('Fetch error:', { url, error: error.message })
      throw error
    }
  }
}

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  // 全局錯誤處理
  useEffect(() => {
    if (!isClient) return

    // 錯誤處理設置
    window.onerror = (msg, url, lineNo, columnNo, error) => {
      console.log('Global Error:', {
        message: msg,
        url: url,
        lineNo: lineNo,
        columnNo: columnNo,
        error: error?.stack,
      })
      return false
    }

    window.onunhandledrejection = (event) => {
      console.log('Unhandled Promise Rejection:', event.reason)
    }

    // 動態導入 bootstrap
    const loadBootstrap = async () => {
      await import('bootstrap/dist/js/bootstrap')
    }
    loadBootstrap()
  }, [])

  // 取得頁面布局
  const getLayout =
    Component.getLayout ||
    ((page) => (isClient ? <DefaultLayout>{page}</DefaultLayout> : page))

  // 渲染組件
  return (
    <AuthProvider>
      <LoadingProviderAnimation close={1} CustomLoader={LoadingAnimation}>
        <LoaderProvider
          close={1}
          CustomLoader={LoadingSpinner}
          excludePaths={['/', '/product']}
        >
          <GroupAuthProvider>
            <CartProvider>
              {getLayout(<Component {...pageProps} />)}
            </CartProvider>
          </GroupAuthProvider>
        </LoaderProvider>
      </LoadingProviderAnimation>
    </AuthProvider>
  )
}

export default MyApp
