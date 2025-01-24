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
  // 添加 protectedRoutes 定義
  const protectedRoutes = [
    '/dashboard',
    '/coupon/coupon-user',
    '/member/profile',
    '/cart/checkout',
    '/member/logout',
    '/blog/create',
    '/blog/edit',
  ]

  // 添加 login 函數
  const login = async (userData) => {
    if (!userData) throw new Error('No user data provided')

    setAuth({
      isAuth: true,
      userData: { ...initUserData, ...userData },
    })
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userData', JSON.stringify(userData))

    return { status: 'success', message: '登入成功' }
  }

  const [auth, setAuth] = useState({
    isAuth: false,
    userData: initUserData,
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCheckAuth = async () => {
    if (!isClient || !router.isReady) return

    try {
      if (router.pathname === '/member/login') return

      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
      if (!isAuthenticated) {
        if (protectedRoutes.includes(router.pathname)) {
          await router.replace('/member/login')
        }
        return
      }

      const res = await checkAuth()
      if (res?.status === 'success' && res?.data?.user) {
        setAuth({
          isAuth: true,
          userData: { ...initUserData, ...res.data.user },
        })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      if (protectedRoutes.includes(router.pathname)) {
        await handleLogout()
      }
    }
  }

  // 登出處理
  const logout = async () => {
    const requestId = Math.random().toString(36).substring(7)

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      })

      if (!response.ok) throw new Error('Logout request failed')

      await Promise.all([
        new Promise((resolve) => {
          setAuth({ isAuth: false, userData: initUserData })
          setTimeout(resolve, 100)
        }),
        localStorage.removeItem('isAuthenticated'),
        localStorage.removeItem('userData'),
      ])

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

  useEffect(() => {
    if (isClient) {
      const initAuth = async () => {
        const isAuthenticated =
          localStorage.getItem('isAuthenticated') === 'true'
        if (!isAuthenticated) return

        try {
          const storedUserData = localStorage.getItem('userData')
          const userData = storedUserData ? JSON.parse(storedUserData) : null

          if (userData) {
            setAuth({
              isAuth: true,
              userData: { ...initUserData, ...userData },
            })
            await handleCheckAuth()
          }
        } catch (error) {
          console.error('Init auth failed:', error)
          await handleLogout()
        }
      }
      initAuth()
    }
  }, [])

  // 添加 handleLogout
  const handleLogout = async () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userData')
    setAuth({ isAuth: false, userData: initUserData })
    await router.replace('/member/login')
  }

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
