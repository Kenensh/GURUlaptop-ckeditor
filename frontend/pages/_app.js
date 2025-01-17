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
      console.log('Starting fetch request:', {
        url,
        method: options.method || 'GET',
        environment: process.env.NODE_ENV,
      })

      // 記錄請求開始時間
      const startTime = Date.now()

      if (
        url.startsWith('/') ||
        url.startsWith('https://gurulaptop-ckeditor.onrender.com')
      ) {
        const newUrl = url.startsWith('/') ? `${BACKEND_URL}${url}` : url
        const finalUrl =
          process.env.NODE_ENV === 'development'
            ? newUrl.replace(
                'https://gurulaptop-ckeditor.onrender.com',
                'http://localhost:3005'
              )
            : newUrl

        console.log('URL transformation:', {
          originalUrl: url,
          finalUrl,
          transformationTime: Date.now() - startTime,
        })

        try {
          const response = await originalFetch(finalUrl, {
            ...options,
            credentials: 'include',
            headers: {
              ...options.headers,
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Origin:
                typeof window !== 'undefined' ? window.location.origin : '',
            },
          })

          console.log('Fetch response received:', {
            url: finalUrl,
            status: response.status,
            statusText: response.statusText,
            responseTime: Date.now() - startTime,
          })

          if (!response.ok) {
            console.warn('Non-OK response:', {
              url: finalUrl,
              status: response.status,
              statusText: response.statusText,
            })
          }

          return response
        } catch (networkError) {
          console.error('Network error:', {
            url: finalUrl,
            error: networkError.message,
            stack: networkError.stack,
          })
          throw networkError
        }
      }

      return originalFetch(url, options)
    } catch (error) {
      console.error('Fetch interceptor error:', {
        url,
        error: error.message,
        stack: error.stack,
        options,
      })
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

  // 後端喚醒機制
  useEffect(() => {
    const wakeUpBackend = async () => {
      console.log('Wake up process starting...')
      console.log('Current BACKEND_URL:', BACKEND_URL)
      console.log('Environment:', process.env.NODE_ENV)

      try {
        console.log('Attempting to wake up backend...')
        const response = await fetch(`${BACKEND_URL}/health`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Origin: window.location.origin,
          },
        })

        console.log('Response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Backend is awake! Data:', data)
        } else {
          console.log('Backend response not ok:', response.statusText)
          console.log('Full response:', response)
        }
      } catch (error) {
        console.error('Backend wake-up attempt failed:', {
          error: error,
          message: error.message,
          stack: error.stack,
          type: error.name,
        })
      }
    }

    if (isClient) {
      console.log('Initializing wake up mechanism...')
      // 立即執行一次
      wakeUpBackend()
      // 設定每 14 分鐘執行一次
      const interval = setInterval(wakeUpBackend, 14 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [])

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
