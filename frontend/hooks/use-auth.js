import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { checkAuth } from '@/services/user'

const isClient = typeof window !== 'undefined'
const AuthContext = createContext(null)
AuthContext.displayName = 'AuthProvider'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005'
    : 'https://gurulaptop-ckeditor.onrender.com')

// 初始用戶數據
export const initUserData = {
  id: 0,
  email: '',
  name: '',
  nickname: '',
  birthday: '',
  mobile: '',
  address: '',
  credit_card: '',
}

// 默認上下文值
const defaultContextValue = {
  auth: { isAuth: false, userData: initUserData },
  login: () => Promise.resolve({ status: 'error', message: 'SSR不支援登入' }),
  logout: () => Promise.resolve({ status: 'error', message: 'SSR不支援登出' }),
  setAuth: () => {},
  isLoading: true,
}

export const AuthProvider = ({ children }) => {
  // 狀態管理
  const [auth, setAuth] = useState({
    isAuth: false,
    userData: initUserData,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // 受保護的路由
  const protectedRoutes = [
    '/dashboard',
    '/coupon/coupon-user',
    '/member/profile',
    '/cart/checkout',
    '/member/logout',
    '/blog/create',
    '/blog/edit',
  ]

  // 登入處理
  const login = async (userData) => {
    const requestId = Math.random().toString(36).substring(7)
    console.log(`[${requestId}] Login function called with userData:`, userData)

    if (!isClient) {
      console.error(`[${requestId}] Cannot login on server side`)
      return { status: 'error', message: 'Cannot login on server side' }
    }

    try {
      if (!userData) {
        throw new Error('No user data provided')
      }

      // 使用 Promise.all 確保狀態更新和本地存儲同步
      await Promise.all([
        new Promise((resolve) => {
          setAuth((prevAuth) => {
            console.log(`[${requestId}] Updating auth state:`, {
              from: prevAuth,
              to: {
                isAuth: true,
                userData: { ...initUserData, ...userData },
              },
            })
            return {
              isAuth: true,
              userData: { ...initUserData, ...userData },
            }
          })
          setTimeout(resolve, 300)
        }),
        localStorage.setItem('isAuthenticated', 'true'),
        localStorage.setItem('userData', JSON.stringify(userData)),
      ])

      console.log(`[${requestId}] Auth state updated successfully`)
      return { status: 'success', message: '登入成功' }
    } catch (error) {
      console.error(`[${requestId}] Login error:`, error)
      setAuth({ isAuth: false, userData: initUserData })
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userData')
      return {
        status: 'error',
        message: error?.message || '登入失敗',
      }
    }
  }

  // 登出處理
  const logout = async () => {
    const requestId = Math.random().toString(36).substring(7)
    console.log(`[${requestId}] Logout function called`)

    if (!isClient) {
      return { status: 'error', message: 'Cannot logout on server side' }
    }

    try {
      // 呼叫登出 API
      const response = await fetch(`${BACKEND_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Logout request failed')
      }

      // 清除本地狀態
      await Promise.all([
        new Promise((resolve) => {
          setAuth({ isAuth: false, userData: initUserData })
          setTimeout(resolve, 100)
        }),
        localStorage.removeItem('isAuthenticated'),
        localStorage.removeItem('userData'),
      ])

      console.log(`[${requestId}] Redirecting to login page`)
      await router.replace('/member/login')

      return { status: 'success', message: '登出成功' }
    } catch (error) {
      console.error(`[${requestId}] Logout error:`, error)
      return {
        status: 'error',
        message: error?.message || '登出失敗',
      }
    }
  }

  // 認證檢查
  const handleCheckAuth = async () => {
    const requestId = Math.random().toString(36).substring(7)
    if (!isClient || !router.isReady) return

    console.log(`[${requestId}] Checking auth for path:`, router.pathname)
    const needsAuth = protectedRoutes.some((route) =>
      router.pathname.startsWith(route)
    )

    if (!needsAuth) {
      setIsLoading(false)
      return
    }

    try {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      console.log(`[${requestId}] Local auth status:`, isAuthenticated)

      if (!isAuthenticated) {
        throw new Error('Not authenticated')
      }

      const res = await checkAuth()
      console.log(`[${requestId}] Auth check response:`, res)

      if (res?.data?.status === 'success' && res?.data?.data?.user) {
        await Promise.all([
          new Promise((resolve) => {
            setAuth({
              isAuth: true,
              userData: { ...initUserData, ...res.data.data.user },
            })
            setTimeout(resolve, 100)
          }),
          localStorage.setItem('userData', JSON.stringify(res.data.data.user)),
        ])
      } else {
        throw new Error('Auth check failed')
      }
    } catch (error) {
      console.error(`[${requestId}] Auth check error:`, error)

      // 清除本地狀態
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userData')

      await router.replace({
        pathname: '/member/login',
        query: { returnUrl: router.asPath },
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 初始化認證狀態
  useEffect(() => {
    if (isClient) {
      const initAuth = () => {
        const isAuthenticated =
          localStorage.getItem('isAuthenticated') === 'true'
        const storedUserData = localStorage.getItem('userData')

        if (isAuthenticated && storedUserData) {
          try {
            const userData = JSON.parse(storedUserData)
            setAuth({
              isAuth: true,
              userData: { ...initUserData, ...userData },
            })
          } catch (error) {
            console.error('Failed to parse stored user data:', error)
            localStorage.removeItem('isAuthenticated')
            localStorage.removeItem('userData')
          }
        }
      }

      initAuth()
    }
  }, [])

  // 監控路由變化
  useEffect(() => {
    if (isClient && router.isReady) {
      handleCheckAuth()
    }
  }, [router.isReady, router.pathname])

  // 監控認證狀態變化
  useEffect(() => {
    if (isClient) {
      console.log('Auth state updated:', auth)
    }
  }, [auth])

  // 服務端渲染時使用默認值
  if (!isClient) {
    return (
      <AuthContext.Provider value={defaultContextValue}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        logout,
        setAuth,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 內使用')
  }
  return context
}

export default useAuth
