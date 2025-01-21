import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { checkAuth } from '@/services/user'

const isClient = typeof window !== 'undefined'
const AuthContext = createContext(null)
AuthContext.displayName = 'AuthProvider' // 加入這行
const MAX_LOGIN_ATTEMPTS = 3
const HOME_ROUTE = '/'

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
  const login = async (userData) => {
    console.log('Login function called with userData:', userData)

    if (!isClient) {
      console.error('Cannot login on server side')
      return { status: 'error', message: 'Cannot login on server side' }
    }

    try {
      if (!userData) {
        throw new Error('No user data provided')
      }

      // 使用 Promise.all 確保狀態更新和本地存儲都完成
      await Promise.all([
        new Promise((resolve) => {
          setAuth((prevAuth) => {
            console.log('Updating auth state from:', prevAuth)
            const newAuth = {
              isAuth: true,
              userData: {
                ...initUserData,
                ...userData,
              },
            }
            console.log('To new auth state:', newAuth)
            return newAuth
          })
          // 延長等待時間
          setTimeout(resolve, 300)
        }),
        // 可以考慮在本地存儲保存一個標記
        localStorage.setItem('isAuthenticated', 'true'),
      ])

      console.log('Auth state updated successfully')
      return { status: 'success', message: '登入成功' }
    } catch (error) {
      console.error('Login error:', error)
      setAuth({ isAuth: false, userData: initUserData })
      localStorage.removeItem('isAuthenticated')
      return {
        status: 'error',
        message: error?.message || '登入失敗',
      }
    }
  }

  // 改進的 logout 函數
  const logout = async () => {
    console.log('Logout function called')

    if (!isClient) {
      return { status: 'error', message: 'Cannot logout on server side' }
    }

    try {
      // 先清除狀態
      await new Promise((resolve) => {
        setAuth({ isAuth: false, userData: initUserData })
        setTimeout(resolve, 100)
      })

      // 清除存儲
      localStorage.removeItem('auth_token')
      sessionStorage.removeItem('auth_token')

      console.log('Redirecting to login page')
      await router.replace(loginRoute)

      return { status: 'success', message: '登出成功' }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        status: 'error',
        message: error?.message || '登出失敗',
      }
    }
  }

  // 改進的認證檢查函數
  const handleCheckAuth = async () => {
    if (!isClient || !router.isReady) return

    console.log('Checking auth for path:', router.pathname)
    const needsAuth = protectedRoutes.some((route) =>
      router.pathname.startsWith(route)
    )
    console.log('Authentication required:', needsAuth)

    if (!needsAuth) {
      setIsLoading(false)
      return
    }

    try {
      console.log('Performing auth check...')
      const res = await checkAuth()
      console.log('Auth check response:', res)

      const isAuthenticated =
        res?.data?.status === 'success' && res?.data?.data?.user

      if (isAuthenticated) {
        console.log('User authenticated, updating state')
        await new Promise((resolve) => {
          setAuth({
            isAuth: true,
            userData: { ...initUserData, ...res.data.data.user },
          })
          setTimeout(resolve, 100)
        })
      } else {
        console.log('Authentication failed, redirecting to login')
        const returnUrl = router.asPath
        await router.replace({
          pathname: loginRoute,
          query: returnUrl ? { returnUrl } : undefined,
        })
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.replace(loginRoute)
    } finally {
      setIsLoading(false)
    }
  }

  // 監控 auth 狀態變化
  useEffect(() => {
    if (isClient) {
      console.log('Auth state updated:', auth)
    }
  }, [auth])

  // 監控路由變化
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!isClient || !router.isReady) return

      console.log('Checking auth for path:', router.pathname)
      const needsAuth = protectedRoutes.some((route) =>
        router.pathname.startsWith(route)
      )

      if (!needsAuth) {
        setIsLoading(false)
        return
      }

      try {
        const isAuthenticated =
          localStorage.getItem('isAuthenticated') === 'true'
        if (!isAuthenticated) {
          throw new Error('Not authenticated')
        }

        const res = await checkAuth()
        if (res?.data?.status === 'success' && res?.data?.data?.user) {
          setAuth({
            isAuth: true,
            userData: { ...initUserData, ...res.data.data.user },
          })
        } else {
          throw new Error('Auth check failed')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        await router.replace({
          pathname: loginRoute,
          query: { returnUrl: router.asPath },
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthStatus()
  }, [router.isReady, router.pathname])

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
