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
      const userDataStr = localStorage.getItem('userData')
      if (token && userDataStr) {
        try {
          const userData = JSON.parse(userDataStr)
          return {
            isAuth: true,
            userData,
          }
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('userData')
        }
      }
    }
    return { isAuth: false, userData: initUserData }
  })

  useEffect(() => {
    console.log('AuthProvider mounted/updated', auth)
  }, [auth])

  const login = async (result) => {
    try {
      if (!result) {
        throw new Error('Login data is required')
      }

      // API 返回的資料結構處理
      console.log('Login data received:', result)

      // 存儲 token 和使用者資料
      localStorage.setItem('token', result.token)
      localStorage.setItem('userData', JSON.stringify(result))

      // 更新 auth 狀態
      setAuth({
        isAuth: true,
        userData: result,
      })

      console.log('Auth state after login:', {
        isAuth: true,
        userData: result,
      })

      return { status: 'success' }
    } catch (error) {
      console.error('Login error:', error)
      return { status: 'error', message: error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    setAuth({ isAuth: false, userData: initUserData })
  }

  useEffect(() => {
    console.log('Auth state changed:', auth)
  }, [auth])

  AuthProvider.displayName = 'AuthProvider'

  return (
    <AuthContext.Provider value={{ auth, login, logout, setAuth }}>
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
