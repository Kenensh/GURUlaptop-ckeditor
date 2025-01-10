import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { checkAuth } from '@/services/user'

const AuthContext = createContext(null)
const MAX_LOGIN_ATTEMPTS = 3 // 設定最大登入嘗試次數
const HOME_ROUTE = '/' // 設定首頁路由

export const initUserData = {
  user_id: 0,
  name: '',
  password: '',
  gender: '',
  birthdate: '',
  phone: '',
  email: '',
  country: '',
  city: '',
  district: '',
  road_name: '',
  detailed_address: '',
  image_path: '',
  remarks: '',
  level: 0,
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuth: false,
    userData: initUserData,
  })
  const [loginAttempts, setLoginAttempts] = useState(0)

  const router = useRouter()
  const loginRoute = '/member/login'
  // 修改需要保護的路由列表
  const protectedRoutes = [
    '/dashboard',
    '/coupon/coupon-user',
    '/member/profile',
    // 其他需要登入的路由
  ]

  // 登入函數修改
  const login = async (email, password) => {
    try {
      if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        console.log(`已達到最大登入嘗試次數(${MAX_LOGIN_ATTEMPTS}次)`)
        router.replace(HOME_ROUTE)
        return {
          status: 'error',
          message: '登入嘗試次數過多，請稍後再試',
        }
      }

      const response = await fetch('http://localhost:3005/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.status === 'success') {
        console.log('登入成功')
        setLoginAttempts(0) // 重置嘗試次數
        setAuth({
          isAuth: true,
          userData: { ...initUserData, ...result.data.user },
        })
        return { status: 'success', message: '登入成功' }
      }

      // 登入失敗處理
      const newAttempts = loginAttempts + 1
      console.log(`登入失敗！第 ${newAttempts} 次嘗試`)
      setLoginAttempts(newAttempts)

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        console.log('登入失敗次數過多，即將返回首頁')
        setTimeout(() => router.replace(HOME_ROUTE), 1500)
      }

      return {
        status: 'error',
        message: `登入失敗 (第 ${newAttempts}/${MAX_LOGIN_ATTEMPTS} 次嘗試)`,
      }
    } catch (error) {
      console.error('登入錯誤:', error)
      return { status: 'error', message: '系統錯誤' }
    }
  }

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:3005/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.status === 'success') {
        setAuth({
          isAuth: false,
          userData: initUserData,
        })
        // 登出時重置登入嘗試次數
        setLoginAttempts(0)
        console.log('登出成功！重置登入嘗試次數')
        await router.replace(loginRoute)
        return { status: 'success', message: '登出成功' }
      }
      return { status: 'error', message: '登出失敗' }
    } catch (error) {
      console.error('登出過程發生錯誤:', error)
      return { status: 'error', message: '登出系統發生錯誤' }
    }
  }

  // 修改認證檢查函數
  const handleCheckAuth = async () => {
    // 不在受保護路由，不需要檢查
    if (!protectedRoutes.includes(router.pathname)) {
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
        console.log('需要登入才能訪問此頁面')
        router.replace(loginRoute)
      }
    } catch (error) {
      console.error('驗證檢查錯誤:', error)
      if (protectedRoutes.includes(router.pathname)) {
        router.replace(loginRoute)
      }
    }
  }

  useEffect(() => {
    console.log('認證狀態變更:', auth)
  }, [auth])

  useEffect(() => {
    if (router.isReady) {
      handleCheckAuth()
    }
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
