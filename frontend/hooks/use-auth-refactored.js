import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import api from '@/services/api'
import Swal from 'sweetalert2'

const AuthContext = createContext(null)
const isClient = typeof window !== 'undefined'

// 初始化會員狀態
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
    isLoading: true, // 添加加載狀態，初始為 true
    error: null, // 添加錯誤狀態
  })

  const router = useRouter()

  // 登入頁路由
  const loginRoute = '/member/login'
  
  // 隱私頁面路由 - 需要登入才能訪問的頁面
  const protectedRoutes = [
    '/dashboard',
    '/coupon/coupon-user',
    '/chatroom',
    '/cart',
    '/blog/blog-user-detail',
    '/blog/blog-user-edit',
    '/blog/blog-user-overview',
    '/member/profile',
  ]

  // 將 userData 存儲到 localStorage
  const saveUserDataToLocalStorage = (userData) => {
    if (isClient) {
      localStorage.setItem('userData', JSON.stringify(userData))
    }
  }

  // 從 localStorage 中獲取 userData
  const getUserDataFromLocalStorage = () => {
    if (!isClient) return null
    const userData = localStorage.getItem('userData')
    return userData ? JSON.parse(userData) : null
  }

  // 檢查當前頁面是否是需要登入的頁面
  const isProtectedRoute = (path) => {
    return protectedRoutes.some((route) => path.startsWith(route))
  }

  // 登入函數
  const login = async (data) => {
    try {
      // 設置 auth 狀態
      setAuth({
        isAuth: true,
        userData: data.user || data,
        isLoading: false,
        error: null,
      })
      
      // 將數據保存到 localStorage
      saveUserDataToLocalStorage(data.user || data)
      
      return { status: 'success' }
    } catch (error) {
      console.error('Login error:', error)
      setAuth({
        ...auth,
        isLoading: false,
        error: error.message,
      })
      return { status: 'error', message: error.message }
    }
  }

  // 登出函數
  const logout = async () => {
    try {
      // 呼叫 API 登出
      await api.auth.logout()
      
      // 清除所有状态
      setAuth({
        isAuth: false,
        userData: initUserData,
        isLoading: false,
        error: null,
      })
      
      // 清除 localStorage 中的數據
      if (isClient) {
        localStorage.removeItem('userData')
        localStorage.removeItem('token')
      }
      
      // 如果當前頁面是需要登入的頁面，重定向到登入頁
      if (isClient && isProtectedRoute(window.location.pathname)) {
        router.push(loginRoute)
      }
      
      Swal.fire({
        icon: 'success',
        title: '登出成功',
        text: '感謝您的使用',
        timer: 1500,
      })
      
      return { status: 'success' }
    } catch (error) {
      console.error('Logout error:', error)
      return { status: 'error', message: error.message }
    }
  }

  // 檢查登入狀態
  const checkAuthStatus = async () => {
    try {
      // 如果不是客戶端，則直接返回
      if (!isClient) {
        setAuth((prevAuth) => ({ ...prevAuth, isLoading: false }))
        return
      }

      // 檢查 localStorage 中是否有用戶數據
      const userData = getUserDataFromLocalStorage()
      
      if (userData) {
        // 使用 API 檢查令牌是否有效
        const result = await api.auth.checkAuth()
        
        if (result && result.status === 'success') {
          setAuth({
            isAuth: true,
            userData: result.data || userData,
            isLoading: false,
            error: null,
          })
        } else {
          // 如果 API 檢查失敗，清除數據並重置狀態
          localStorage.removeItem('userData')
          localStorage.removeItem('token')
          
          setAuth({
            isAuth: false,
            userData: initUserData,
            isLoading: false,
            error: result?.message || '身份驗證失敗',
          })
          
          // 如果當前頁面是需要登入的頁面，重定向到登入頁
          if (isProtectedRoute(router.pathname)) {
            router.push(loginRoute)
          }
        }
      } else {
        // 如果沒有用戶數據，重置狀態
        setAuth({
          isAuth: false,
          userData: initUserData,
          isLoading: false,
          error: null,
        })
        
        // 如果當前頁面是需要登入的頁面，重定向到登入頁
        if (isProtectedRoute(router.pathname)) {
          router.push(loginRoute)
        }
      }
    } catch (error) {
      console.error('Check auth status error:', error)
      
      // 錯誤時清除數據並重置狀態
      if (isClient) {
        localStorage.removeItem('userData')
        localStorage.removeItem('token')
      }
      
      setAuth({
        isAuth: false,
        userData: initUserData,
        isLoading: false,
        error: error.message,
      })
      
      // 如果當前頁面是需要登入的頁面，重定向到登入頁
      if (isClient && isProtectedRoute(router.pathname)) {
        router.push(loginRoute)
      }
    }
  }

  // 更新使用者資料
  const updateUserData = (newUserData) => {
    setAuth((prevAuth) => ({
      ...prevAuth,
      userData: { ...prevAuth.userData, ...newUserData },
    }))
    
    // 更新 localStorage 中的用戶數據
    if (isClient) {
      const userData = getUserDataFromLocalStorage()
      if (userData) {
        saveUserDataToLocalStorage({ ...userData, ...newUserData })
      }
    }
  }

  // 在頁面加載和路由變更時檢查登入狀態
  useEffect(() => {
    checkAuthStatus()
  }, [router.pathname])

  // 提供 auth 狀態和操作函數
  const value = {
    auth,
    login,
    logout,
    updateUserData,
    checkAuthStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 導出自定義 hook 用於使用 AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
