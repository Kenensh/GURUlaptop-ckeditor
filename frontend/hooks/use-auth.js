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

  const handleCheckAuth = async () => {
    if (!isClient || !router.isReady) return

    console.log('檢查路徑:', router.pathname)
    const needsAuth = protectedRoutes.some((route) =>
      router.pathname.startsWith(route)
    )
    console.log('需要認證:', needsAuth)

    // 如果不需要認證，直接返回
    if (!needsAuth) {
      setIsLoading(false)
      return
    }

    try {
      const res = await checkAuth()
      console.log('認證檢查結果:', res)

      const isAuthenticated =
        res?.data?.status === 'success' && res?.data?.data?.user

      if (isAuthenticated) {
        console.log('用戶已認證，更新狀態')
        setAuth({
          isAuth: true,
          userData: { ...initUserData, ...res.data.data.user },
        })
      } else {
        console.log('認證失敗，重定向到登入頁')
        // 保存當前路徑
        const returnUrl = router.asPath
        await router.replace({
          pathname: loginRoute,
          query: returnUrl ? { returnUrl } : undefined,
        })
      }
    } catch (error) {
      console.error('認證檢查錯誤:', error)
      router.replace(loginRoute)
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
