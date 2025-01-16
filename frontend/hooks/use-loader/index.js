import { useState, useContext, createContext, useRef, useEffect } from 'react'
import { DefaultLoader, LoaderText } from './components'
import { useRouter } from 'next/router'
import { LoadingSpinner } from '@/components/dashboard/loading-spinner'
import { useLoading as useNewLoading } from '@/context/LoadingContext'

const isClient = typeof window !== 'undefined'
const LoaderContext = createContext(null)

// delay 和 timeout 函數保持不變...

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const LoaderProvider = ({
  children,
  close = 2,
  global = true,
  CustomLoader = LoadingSpinner,
  excludePaths = [],
}) => {
  const router = useRouter()
  const [show, setShow] = useState(false)
  const { showLoading: showNewLoading, hideLoading: hideNewLoading } =
    useNewLoading()

  useEffect(() => {
    if (!isClient) return

    const handleChangeStart = () => {
      const currentPath = router.pathname
      const shouldShowLoader = !excludePaths.some(
        (path) => currentPath === path || currentPath.startsWith(`${path}/`)
      )

      if (global && shouldShowLoader) {
        setShow(true)
        showNewLoading()
      }
    }

    const handleChangeEnd = () => {
      if (!isClient) return
      if (close && global) {
        timeout(close * 1000).then(() => {
          setShow(false)
          hideNewLoading()
        })
      }
    }

    const initialCheck = () => {
      if (!isClient) return
      const currentPath = router.pathname
      const shouldHideLoader = excludePaths.some(
        (path) => currentPath === path || currentPath.startsWith(`${path}/`)
      )
      if (shouldHideLoader) {
        setShow(false)
        hideNewLoading()
      }
    }

    initialCheck()

    router.events.on('routeChangeStart', handleChangeStart)
    router.events.on('routeChangeComplete', handleChangeEnd)
    router.events.on('routeChangeError', handleChangeEnd)

    return () => {
      router.events.off('routeChangeStart', handleChangeStart)
      router.events.off('routeChangeComplete', handleChangeEnd)
      router.events.off('routeChangeError', handleChangeEnd)
    }
  }, [router, global, close, showNewLoading, hideNewLoading, excludePaths])

  // 提供一個基本的 SSR 狀態
  if (!isClient) {
    return (
      <LoaderContext.Provider
        value={{
          showLoader: () => {},
          hideLoader: () => {},
          loading: false,
          delay,
          loader: () => null,
          loaderText: () => null,
          isNewLoading: false,
          showNewLoading: () => {},
          hideNewLoading: () => {},
        }}
      >
        {children}
      </LoaderContext.Provider>
    )
  }

  return (
    <LoaderContext.Provider
      value={{
        showLoader: () => {
          if (!isClient) return
          const currentPath = router.pathname
          const shouldShowLoader = !excludePaths.some(
            (path) => currentPath === path || currentPath.startsWith(`${path}/`)
          )

          if (shouldShowLoader) {
            setShow(true)
            showNewLoading()
            if (close) {
              timeout(close * 1000).then(() => {
                setShow(false)
                hideNewLoading()
              })
            }
          }
        },
        hideLoader: () => {
          if (!isClient) return
          setShow(false)
          hideNewLoading()
        },
        loading: show,
        delay,
        loader: () => <CustomLoader show={show} />,
        loaderText: (text) => <LoaderText text={text} show={show} />,
      }}
    >
      {children}
    </LoaderContext.Provider>
  )
}

export const useLoader = () => {
  const context = useContext(LoaderContext)
  const newLoading = useNewLoading()

  if (!context) {
    throw new Error('useLoader must be used within LoadingProvider')
  }

  return {
    ...context,
    isNewLoading: newLoading.isLoading,
    showNewLoading: newLoading.showLoading,
    hideNewLoading: newLoading.hideLoading,
  }
}
