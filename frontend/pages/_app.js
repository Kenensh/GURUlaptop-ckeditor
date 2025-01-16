import { useEffect } from 'react'
import { useRouter } from 'next/router' // 新增

// ... (其他 imports 保持不變)

const isClient = typeof window !== 'undefined'

export default function MyApp({ Component, pageProps }) {
  const router = useRouter() // 新增
  
  useEffect(() => {
    // 增加全局錯誤處理
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

      // 處理 Promise 錯誤
      window.onunhandledrejection = function (event) {
        console.log('Unhandled Promise Rejection:', event.reason)
      }
    }

    import('bootstrap/dist/js/bootstrap')
  }, [])

  // 優化 getLayout
  const getLayout = Component.getLayout || ((page) => (
    <DefaultLayout>{page}</DefaultLayout>
  ))

  // 檢查是否在服務器端渲染且是需要認證的頁面
  if (!isClient) {
    return getLayout(<Component {...pageProps} />)
  }

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