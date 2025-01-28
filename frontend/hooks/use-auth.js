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
  // 在最上方就設置 displayName
  AuthProvider.displayName = 'AuthProvider'

  const [auth, setAuth] = useState(() => {
    if (isClient) {
      const token = localStorage.getItem('token')
      const userDataStr = localStorage.getItem('userData')
      if (token && userDataStr) {
        try {
          const userData = JSON.parse(userDataStr)
          console.log('Initial auth state with token:', {
            isAuth: true,
            userData,
          })
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
    console.log('Initial auth state without token:', {
      isAuth: false,
      userData: initUserData,
    })
    return { isAuth: false, userData: initUserData }
  })

  useEffect(() => {
    console.log('AuthProvider state:', {
      hasToken: !!localStorage.getItem('token'),
      authState: auth,
    })
  }, [auth])

  AuthProvider.displayName = 'AuthProvider'

  return (
    <AuthContext.Provider value={{ auth, login, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
AuthProvider.displayName = 'AuthProvider'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 必須在 AuthProvider 內使用')
  return context
}

export default useAuth
