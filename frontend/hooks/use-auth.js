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
  const [auth, setAuth] = useState(() => {
    if (isClient) {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('userData')
      if (token && userData) {
        return {
          isAuth: true,
          userData: JSON.parse(userData),
        }
      }
    }
    return { isAuth: false, userData: initUserData }
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const login = async (userData) => {
    try {
      if (!userData.token) {
        throw new Error('No token provided')
      }

      localStorage.setItem('token', userData.token)
      localStorage.setItem('userData', JSON.stringify(userData))

      setAuth({
        isAuth: true,
        userData: userData,
      })

      return { status: 'success' }
    } catch (error) {
      console.error('Login error:', error)
      return { status: 'error', message: error.message }
    }
  }

  const handleCheckAuth = async () => {
    if (!isClient || !router.isReady) return

    const token = localStorage.getItem('token')
    if (!token) {
      await handleLogout()
      return
    }

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
    await handleLogout()
  }

  const handleLogout = async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    setAuth({ isAuth: false, userData: initUserData })
    await router.replace('/member/login')
  }

  useEffect(() => {
    if (isClient && router.isReady && auth.isAuth) {
      const token = localStorage.getItem('token')
      if (!token) {
        handleLogout()
      }
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
