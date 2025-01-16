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

  // 改進的 login 函數
  const login = async (email, password) => {
    if (!isClient) {
      return { status: 'error', message: 'Cannot login on server side' }
    }

    try {
      if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        return { status: 'error', message: '登入嘗試次數過多，請稍後再試' }
      }

      // TODO: 實作實際的登入邏輯
      // const response = await loginAPI(email, password)

      setLoginAttempts((prev) => prev + 1)
      return { status: 'success', message: '登入成功' }
    } catch (error) {
      console.error('登入錯誤:', error)
      setLoginAttempts((prev) => prev + 1)
      return {
        status: 'error',
        message: error?.response?.data?.message || '系統錯誤',
      }
    }
  }

  // 改進的 logout 函數
  const logout = async () => {
    if (!isClient) {
      return { status: 'error', message: 'Cannot logout on server side' }
    }

    try {
      // TODO: 實作實際的登出 API 呼叫
      // await logoutAPI()

      setAuth({
        isAuth: false,
        userData: initUserData,
      })

      // 清除本地存儲
      if (isClient) {
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth_token')
      }

      return { status: 'success', message: '登出成功' }
    } catch (error) {
      console.error('登出錯誤:', error)
      return {
        status: 'error',
        message: error?.response?.data?.message || '登出系統發生錯誤',
      }
    }
  }

  // 改進的認證檢查函數
  const handleCheckAuth = async () => {
    if (!isClient || !router.isReady) return

    // 檢查是否需要認證
    const needsAuth = protectedRoutes.some((route) =>
      router.pathname.startsWith(route)
    )

    if (!needsAuth) {
      setIsLoading(false)
      return
    }

    try {
      const res = await checkAuth()
      const isAuthenticated =
        res?.data?.status === 'success' && res?.data?.data?.user

      if (isAuthenticated) {
        setAuth({
          isAuth: true,
          userData: { ...initUserData, ...res.data.data.user },
        })
      } else if (needsAuth) {
        router.replace({
          pathname: loginRoute,
          query: { returnUrl: router.asPath },
        })
      }
    } catch (error) {
      console.error('認證檢查錯誤:', error)
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
      console.log('認證狀態變更:', auth)
    }
  }, [auth])

  useEffect(() => {
    if (isClient && router.isReady) {
      handleCheckAuth()
    }
  }, [router.isReady, router.pathname])

  // 服務器端渲染時返回預設值
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
