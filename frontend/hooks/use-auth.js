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
      try {
        const token = localStorage.getItem('token')
        const userDataStr = localStorage.getItem('userData')

        // 增加更嚴格的驗證
        if (token && userDataStr) {
          try {
            const userData = JSON.parse(userDataStr)
            // 確保 userData 是有效的對象
            if (userData && typeof userData === 'object') {
              return {
                isAuth: true,
                userData,
              }
            }
          } catch (error) {
            // JSON 解析錯誤，清除無效數據
            localStorage.removeItem('token')
            localStorage.removeItem('userData')
            console.error('Invalid userData in localStorage:', error)
          }
        }
      } catch (error) {
        console.error('Error checking auth state:', error)
      }
    }
    // 如果任何檢查失敗，返回初始狀態
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

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No token found')
      }

      const response = await checkAuth()
      if (response?.status === 'success' && response?.data?.user) {
        setAuth({
          isAuth: true,
          userData: response.data.user,
        })
      } else {
        throw new Error('Invalid auth response')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // 清除所有認證相關數據
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
      setAuth({ isAuth: false, userData: initUserData })
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
    if (isClient && router.isReady) {
      const token = localStorage.getItem('token')
      if (token) {
        handleCheckAuth()
      } else if (auth.isAuth) {
        // 如果沒有 token 但 isAuth 為 true，重置狀態
        setAuth({ isAuth: false, userData: initUserData })
      }
    }
  }, [router.isReady])

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
