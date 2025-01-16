import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { checkAuth } from '@/services/user'

const isClient = typeof window !== 'undefined'
const AuthContext = createContext(null)
const MAX_LOGIN_ATTEMPTS = 3
const HOME_ROUTE = '/'

// ... initUserData 保持不變 ...

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuth: false,
    userData: initUserData,
  })
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(true) // 添加載入狀態
  const router = useRouter()
  const loginRoute = '/member/login'

  const protectedRoutes = [
    '/dashboard',
    '/coupon/coupon-user',
    '/member/profile',
  ]

  // 修改 login 函數
  const login = async (email, password) => {
    if (!isClient)
      return { status: 'error', message: 'Cannot login on server side' }

    try {
      // ... 登入邏輯保持不變 ...
    } catch (error) {
      console.error('登入錯誤:', error)
      return { status: 'error', message: '系統錯誤' }
    }
  }

  // 修改 logout 函數
  const logout = async () => {
    if (!isClient)
      return { status: 'error', message: 'Cannot logout on server side' }

    try {
      // ... 登出邏輯保持不變 ...
    } catch (error) {
      console.error('登出過程發生錯誤:', error)
      return { status: 'error', message: '登出系統發生錯誤' }
    }
  }

  // 修改認證檢查函數
  const handleCheckAuth = async () => {
    if (!isClient || !router.isReady) return

    if (!protectedRoutes.includes(router.pathname)) {
      setIsLoading(false)
      return
    }

    try {
      const res = await checkAuth()
      console.log('驗證狀態檢查:', res)

      if (res?.data?.status === 'success' && res?.data?.data?.user) {
        setAuth({
          isAuth: true,
          userData: { ...initUserData, ...res.data.data.user },
        })
      } else if (protectedRoutes.includes(router.pathname)) {
        router.replace(loginRoute)
      }
    } catch (error) {
      console.error('驗證檢查錯誤:', error)
      if (protectedRoutes.includes(router.pathname)) {
        router.replace(loginRoute)
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

  // 如果是服務器端渲染，返回一個基礎狀態
  if (!isClient && isLoading) {
    return <>{children}</>
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
