import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { checkAuth } from '@/services/user'
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

  // 登入功能
  const login = async (userData) => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005'}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '登入失敗')
      }

      const result = await response.json()
      
      if (result.status === 'success') {
        // 成功登入，設定 auth 狀態
        const updatedUserData = { ...initUserData, ...result.data.user }
        
        setAuth({
          isAuth: true,
          userData: updatedUserData,
          isLoading: false,
          error: null,
        })

        // 在本地存儲中保存身份驗證狀態
        if (isClient) {
          localStorage.setItem('isAuthenticated', 'true')
        }
        
        return { status: 'success', user: updatedUserData }
      } else {
        throw new Error(result.message || '登入失敗')
      }
    } catch (error) {
      console.error('登入失敗：', error)
      setAuth(prev => ({ ...prev, isLoading: false, error: error.message }))
      return { status: 'error', message: error.message }
    }
  }

  // 登出功能
  const logout = async () => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true }))
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005'}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('登出請求失敗')
      }
      
      const result = await response.json()

      if (result.status === 'success') {
        // 清除本地存儲
        if (isClient) {
          localStorage.removeItem('isAuthenticated')
        }
        
        // 重設 auth 狀態
        setAuth({
          isAuth: false,
          userData: initUserData,
          isLoading: false,
          error: null,
        })
        
        await router.push(loginRoute)
        return { status: 'success' }
      } else {
        throw new Error(result.message || '登出失敗')
      }
    } catch (error) {
      console.error('登出錯誤:', error)
      setAuth(prev => ({ ...prev, isLoading: false, error: error.message }))
      return { status: 'error', message: error.message }
    }
  }

  // 檢查用戶身份狀態
  const handleCheckAuth = async (force = false) => {
    try {
      // 如果已經驗證且非強制更新，則跳過
      if (auth.isAuth && !force) {
        return { status: 'success', user: auth.userData }
      }

      setAuth(prev => ({ ...prev, isLoading: true }))
      const res = await checkAuth()

      if (res.data?.status === 'success' && res.data?.data?.user) {
        const dbUser = res.data.data.user
        const userData = { ...initUserData }
        
        // 將後端返回的用戶數據映射到前端用戶數據結構
        for (const key in userData) {
          if (Object.hasOwn(dbUser, key)) {
            userData[key] = dbUser[key] ?? ''
          }
        }
        
        setAuth({
          isAuth: true,
          userData,
          isLoading: false,
          error: null,
        })
        
        if (isClient) {
          localStorage.setItem('isAuthenticated', 'true')
        }
        
        return { status: 'success', user: userData }
      } else {
        if (isClient) {
          localStorage.removeItem('isAuthenticated')
        }
        
        setAuth({
          isAuth: false,
          userData: initUserData,
          isLoading: false,
          error: res.data?.message || '驗證失敗',
        })
        
        // 如果是受保護的頁面，重定向到登入頁
        if (protectedRoutes.some(route => router.pathname.startsWith(route))) {
          router.push(loginRoute)
        }
        
        return { status: 'error', message: res.data?.message || '驗證失敗' }
      }
    } catch (error) {
      console.error('身份驗證檢查失敗:', error)
      
      setAuth({
        isAuth: false,
        userData: initUserData,
        isLoading: false,
        error: error.message || '驗證過程中發生錯誤',
      })
      
      if (isClient) {
        localStorage.removeItem('isAuthenticated')
      }
      
      return { status: 'error', message: error.message }
    }
  }

  // 初始檢查身份狀態
  useEffect(() => {
    const initialCheck = async () => {
      // 如果瀏覽器本地存儲顯示已登入，才進行驗證
      if (isClient && localStorage.getItem('isAuthenticated') === 'true') {
        await handleCheckAuth(true) // 強制檢查
      } else {
        // 如果沒有本地存儲的登入狀態，直接設置為未登入狀態
        setAuth(prev => ({ ...prev, isLoading: false }))
      }
    }

    if (router.isReady) {
      initialCheck()
    }
  }, [router.isReady])

  // 檢查訪問受保護的頁面
  useEffect(() => {
    const checkProtectedRoute = async () => {
      // 如果當前頁面是受保護的且用戶未登入
      if (protectedRoutes.some(route => router.pathname.startsWith(route))) {
        if (!auth.isAuth && !auth.isLoading) {
          // 本地存儲中檢查是否曾經登入過
          if (isClient && localStorage.getItem('isAuthenticated') === 'true') {
            // 嘗試驗證身份
            const result = await handleCheckAuth(true)
            if (result.status !== 'success') {
              // 驗證失敗，顯示提示並重定向
              Swal.fire({
                icon: 'warning',
                title: '需要登入',
                text: '請先登入以訪問此頁面',
              }).then(() => {
                router.push(loginRoute)
              })
            }
          } else {
            // 從未登入過，直接重定向
            router.push(loginRoute)
          }
        }
      }
    }

    if (router.isReady && !auth.isLoading) {
      checkProtectedRoute()
    }
  }, [router.pathname, auth.isAuth, auth.isLoading, router.isReady])

  // 提供 Context 值
  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        login,
        logout,
        checkAuth: handleCheckAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// 使用 hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 內部使用')
  }
  return context
}

export default useAuth
