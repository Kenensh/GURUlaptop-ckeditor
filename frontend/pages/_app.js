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

// 在 fetch 攔截器部分加強錯誤處理
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch
  window.fetch = async (url, options = {}) => {
    try {
      const startTime = Date.now()
      const defaultHeaders = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Cache-Control': 'no-store',
      }

      if (url.startsWith('/') || url.includes('gurulaptop-ckeditor')) {
        const finalUrl = url.startsWith('/') ? `${BACKEND_URL}${url}` : url

        // 針對非 OPTIONS 請求添加必要的 headers
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

        const response = await originalFetch(finalUrl, options)
        return response
      }

      return originalFetch(url, options)
    } catch (error) {
      console.error('Fetch error:', { url, error: error.message })
      throw error
    }
  }
}

export default function MyApp({ Component, pageProps }) {
  const router = useRouter()

  // 全局錯誤處理
  useEffect(() => {
    if (isClient) {
      window.onerror = function (msg, url, lineNo, columnNo, error) {
        console.log('Global Error:', {
          message: msg,
          url: url,
          lineNo: lineNo,
          columnNo: columnNo,
          error: error?.stack,
        })
        return false
      }

      window.onunhandledrejection = function (event) {
        console.log('Unhandled Promise Rejection:', event.reason)
      }
    }

    // 導入 bootstrap
    import('bootstrap/dist/js/bootstrap')
  }, [])

  // useEffect(() => {
  //   const wakeUpBackend = async () => {
  //     const requestId = Math.random().toString(36).substring(7)
  //     console.log(`[${requestId}] Wake up process starting...`)

  //     try {
  //       const response = await fetch(
  //         'https://gurulaptop-ckeditor.onrender.com/health',
  //         {
  //           method: 'GET',
  //           mode: 'cors',
  //           credentials: 'include',
  //           headers: {
  //             'Content-Type': 'application/json',
  //           },
  //         }
  //       )

  //       if (!response.ok) {
  //         throw new Error(`Health check failed: ${response.status}`)
  //       }

  //       const data = await response.json()
  //       console.log(`[${requestId}] Backend health:`, data)
  //     } catch (error) {
  //       console.error(`[${requestId}] Wake-up failed:`, error)
  //       setTimeout(wakeUpBackend, 5000)
  //     }
  //   }

  //   if (typeof window !== 'undefined') {
  //     const initialTimeout = setTimeout(() => {
  //       wakeUpBackend()
  //       const interval = setInterval(wakeUpBackend, 5 * 60 * 1000) // 每5分鐘
  //       return () => clearInterval(interval)
  //     }, 2000)

  //     return () => clearTimeout(initialTimeout)
  //   }
  // }, [])

  // 取得頁面布局
  const getLayout =
    Component.getLayout ||
    ((page) => {
      if (!isClient) {
        return page
      }
      return <DefaultLayout>{page}</DefaultLayout>
    })

  // 渲染組件，包含所有必要的 Providers
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
