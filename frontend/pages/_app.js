import { useEffect } from 'react'
import { useRouter } from 'next/router'

// 修正 DefaultLayout 的導入路徑
import DefaultLayout from '@/components/layout/default-layout'

//render 用
import 'bootstrap/dist/css/bootstrap.min.css'

// 樣式
import '@/styles/globals.scss'
import '@/styles/product.scss'
import '@/styles/cart.scss'
import '@/styles/loader.scss'
import '@/styles/coupon.scss'
import '@/styles/header.scss'
import '@/styles/footer.scss'

// 首頁
import '@/styles/frontPage.scss'

// 文章/部落格用 css
import '@/styles/ArticleDetail.scss'
import '@/styles/ArticleHomePage.scss'
import '@/styles/BlogCreated.scss'
import '@/styles/BlogDetail.scss'
import '@/styles/BlogEdit.scss'
import '@/styles/BlogHomePage.scss'
import '@/styles/BlogUserOverview.scss'
import 'animate.css'

// 載入購物車context
import { CartProvider } from '@/hooks/use-cart-state'
// 載入認証用context
import { AuthProvider } from '@/hooks/use-auth'
// 載入動畫context
import { LoaderProvider } from '@/hooks/use-loader'
// 自訂用載入動畫元件
import { LoadingSpinner } from '@/components/dashboard/loading-spinner'
// event的scss
import '../styles/event.scss'
// eventdetail的scss
import '../styles/eventDetail.scss'
// evenRegistration的scss
import '../styles/eventRegistration.scss'
// group的scss
import '../styles/group.scss'
// groupCreat的scss
import '../styles/groupCreat.scss'

import { GroupAuthProvider } from '@/context/GroupAuthContext'

//  新增加
import { LoadingProviderAnimation } from '@/context/LoadingContext'
import LoadingAnimation from '@/components/LoadingAnimation/LoadingAnimation'

const isClient = typeof window !== 'undefined'

export default function MyApp({ Component, pageProps }) {
  const router = useRouter()

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

    import('bootstrap/dist/js/bootstrap')
  }, [])

  const getLayout =
    Component.getLayout ||
    ((page) => {
      if (!isClient) {
        // SSR 基本渲染
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
