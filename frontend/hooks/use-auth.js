import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { checkAuth } from '@/services/user'

const isClient = typeof window !== 'undefined'
const AuthContext = createContext(null)
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3005'
    : 'https://gurulaptop-ckeditor.onrender.com')

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
  isLoading: true,
}

export const AuthProvider = ({ children }) => {
  const protectedRoutes = [
    '/dashboard',
    '/coupon/coupon-user',
    '/member/profile',
    '/cart/checkout',
    '/member/logout',
    '/blog/create',
    '/blog/edit',
  ]

  const [auth, setAuth] = useState({ isAuth: false, userData: initUserData })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const login = async (userData) => {
    if (!userData) throw new Error('No user data provided')
    setAuth({ isAuth: true, userData: { ...initUserData, ...userData } })
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userData', JSON.stringify(userData))
    return { status: 'success', message: '登入成功' }
  }

  const handleCheckAuth = async () => {
    if (!isClient || !router.isReady) return

    setIsLoading(true)
    try {
      const res = await checkAuth()
      if (res?.status === 'success' && res?.data?.user) {
        setAuth({
          isAuth: true,
          userData: res.data.user,
        })
      } else {
        throw new Error('驗證失敗')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      await handleLogout()
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      })

      setAuth({ isAuth: false, userData: initUserData })
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userData')

      return { status: 'success', message: '登出成功' }
    } catch (error) {
      console.error('Logout error:', error)
      return { status: 'error', message: '登出失敗' }
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userData')
    setAuth({ isAuth: false, userData: initUserData })
    await router.replace('/member/login')
  }

  useEffect(() => {
    if (isClient && router.isReady && auth.isAuth) {
      handleCheckAuth()
    }
  }, [router.isReady, router.pathname])

  useEffect(() => {
    if (!isClient) return

    console.log('Auth state updated:', auth)
  }, [auth])

  if (!isClient) {
    return (
      <AuthContext.Provider value={defaultContextValue}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, setAuth, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 必須在 AuthProvider 內使用')
  return context
}

export default useAuth
