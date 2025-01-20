import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { checkAuth } from '@/services/user'

const isClient = typeof window !== 'undefined'
const AuthContext = createContext(null)
const MAX_LOGIN_ATTEMPTS = 3
const HOME_ROUTE = '/'

// 定義初始用戶數據
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

// 預設的 context 值，用於 SSR
const defaultContextValue = {
  auth: { isAuth: false, userData: initUserData },
  login: () => Promise.resolve({ status: 'error', message: 'SSR不支援登入' }),
  logout: () => Promise.resolve({ status: 'error', message: 'SSR不支援登出' }),
  setAuth: () => {},
  loginAttempts: 0,
  maxAttempts: MAX_LOGIN_ATTEMPTS,
  isLoading: true,
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuth: false,
    userData: initUserData,
  })
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const loginRoute = '/member/login'

  const protectedRoutes = [
    '/dashboard',
    '/coupon/coupon-user',
    '/member/profile',
    '/cart/checkout',
    '/member/logout',
    '/blog/create',
    '/blog/edit',
  ]

  // 修改後的 login 函數
  const login = async (userData) => {
    if (!isClient) {
      return { status: 'error', message: 'Cannot login on server side' }
    }

    try {
      // 直接設置認證狀態
      setAuth({
        isAuth: true,
        userData: {
          ...initUserData,
          ...userData,
        },
      })

      console.log('Auth state updated:', {
        isAuth: true,
        userData: userData,
      })

      return { status: 'success', message: '登入成功' }
    } catch (error) {
      console.error('Login error:', error)
      return {
        status: 'error',
        message: error?.message || '登入失敗',
      }
    }
  }

  // logout 函數
  const logout = async () => {
    if (!isClient) {
      return { status: 'error', message: 'Cannot logout on server side' }
    }

    try {
      setAuth({
        isAuth: false,
        userData: initUserData,
      })

      // 清除本地存儲
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')

      // 導向登入頁
      await router.push(loginRoute)

      return { status: 'success', message: '登出成功' }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        status: 'error',
        message: error?.message || '登出失敗',
      }
    }
  }

  // 認證檢查函數
  const handleCheckAuth = async () => {
    if (!isClient || !router.isReady) return

    const needsAuth = protectedRoutes.some((route) =>
      router.pathname.startsWith(route)
    )

    if (!needsAuth) {
      setIsLoading(false)
      return
    }

    try {
      const res = await checkAuth()
      console.log('CheckAuth response:', res)

      const isAuthenticated =
        res?.data?.status === 'success' && res?.data?.data?.user

      if (isAuthenticated) {
        setAuth({
          isAuth: true,
          userData: { ...initUserData, ...res.data.data.user },
        })
      } else if (needsAuth) {
        console.log('Redirecting to login due to failed auth check')
        router.replace({
          pathname: loginRoute,
          query: { returnUrl: router.asPath },
        })
      }
    } catch (error) {
      console.error('Auth check error:', error)
      if (needsAuth) {
        router.replace({
          pathname: loginRoute,
          query: { returnUrl: router.asPath },
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isClient) {
      console.log('Auth state changed:', auth)
    }
  }, [auth])

  useEffect(() => {
    if (isClient && router.isReady) {
      handleCheckAuth()
    }
  }, [router.isReady, router.pathname])

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
        loginAttempts,
        maxAttempts: MAX_LOGIN_ATTEMPTS,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 內使用')
  }
  return context
}

export default useAuth
