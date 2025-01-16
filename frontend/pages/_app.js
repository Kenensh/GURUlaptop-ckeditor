import { useEffect } from 'react'
import { useRouter } from 'next/router'
import DefaultLayout from '@/components/layout/default-layout'

// ... (其他 imports 保持不變)

const isClient = typeof window !== 'undefined'

// 後端 API URL
const BACKEND_URL = 'https://gurulaptop-ckeditor.onrender.com'

export default function MyApp({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    if (isClient) {
      // 錯誤處理
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

    import('bootstrap/dist/js/bootstrap')
  }, [])

  // 添加喚醒後端的功能
  useEffect(() => {
    const wakeUpBackend = async () => {
      try {
        console.log('Attempting to wake up backend...')
        const response = await fetch(`${BACKEND_URL}/health`)
        if (response.ok) {
          console.log('Backend is awake!')
        }
      } catch (error) {
        console.log('Backend wake-up attempt failed:', error)
      }
    }

    if (isClient) {
      // 立即執行一次
      wakeUpBackend()

      // 設定每 14 分鐘執行一次
      const interval = setInterval(wakeUpBackend, 14 * 60 * 1000)

      // 清理函數
      return () => clearInterval(interval)
    }
  }, [])

  const getLayout =
    Component.getLayout ||
    ((page) => {
      if (!isClient) {
        return page
      }
      return <DefaultLayout>{page}</DefaultLayout>
    })

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
