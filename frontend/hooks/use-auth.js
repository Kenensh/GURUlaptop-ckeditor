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
      
      console.log('[useAuth Login] 開始登入請求:', userData)
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://gurulaptop-ckeditor.onrender.com'  // 生產環境後端網址
          : 'http://localhost:3005')  // 開發環境
      const loginUrl = `${apiUrl}/api/auth/login`
      
      console.log('[useAuth Login] 登入 URL:', loginUrl)
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        credentials: 'include', // 確保發送和接收 cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      console.log('[useAuth Login] 響應狀態:', response.status)
      console.log('[useAuth Login] 響應頭 Set-Cookie:', response.headers.get('Set-Cookie'))

      if (!response.ok) {
        const error = await response.json()
        console.error('[useAuth Login] 登入錯誤響應:', error)
        throw new Error(error.message || '登入失敗')
      }

      const result = await response.json()
      console.log('[useAuth Login] 登入成功響應:', result)
      
      if (result.status === 'success') {
        // 成功登入後，立即檢查 auth 狀態
        console.log('[useAuth Login] 登入成功，現在檢查 auth 狀態')
        
        // 稍等一下讓 cookie 設置完成
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const authCheckResult = await safeHandleCheckAuth(true)
        
        if (authCheckResult.status === 'success') {
          console.log('[useAuth Login] Auth 檢查成功，登入完成')
          return { status: 'success', user: authCheckResult.user }
        } else {
          console.error('[useAuth Login] Auth 檢查失敗:', authCheckResult)
          throw new Error('登入後認證檢查失敗')
        }
      } else {
        throw new Error(result.message || '登入失敗')
      }
    } catch (error) {
      console.error('[useAuth Login] 登入失敗：', error)
      setAuth(prev => ({ ...prev, isLoading: false, error: error.message }))
      return { status: 'error', message: error.message }
    }
  }

  // 登出功能
  const logout = async () => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true }))
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://gurulaptop-ckeditor.onrender.com'  // 生產環境後端網址
          : 'http://localhost:3005')  // 開發環境
      
      const response = await fetch(`${apiUrl}/api/auth/logout`, {
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
        
        try {
          await router.push(loginRoute)
        } catch (routerError) {
          console.error('[useAuth] Router push error:', routerError)
        }
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
    console.log('[useAuth CheckAuth] handleCheckAuth 被調用，force:', force)
    
    try {
      // 如果已經驗證且非強制更新，則跳過
      if (auth.isAuth && !force) {
        console.log('[useAuth CheckAuth] 已驗證，跳過檢查')
        return Promise.resolve({ status: 'success', user: auth.userData })
      }

      setAuth(prev => ({ ...prev, isLoading: true }))
      
      console.log('[useAuth CheckAuth] 開始檢查身份驗證')
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://gurulaptop-ckeditor.onrender.com'  // 生產環境後端網址
          : 'http://localhost:3005')  // 開發環境
      const checkUrl = `${apiUrl}/api/auth/check`
      
      console.log('[useAuth CheckAuth] 檢查 URL:', checkUrl)
      
      const response = await fetch(checkUrl, {
        method: 'GET',
        credentials: 'include', // 確保發送 cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('[useAuth CheckAuth] 響應狀態:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.log('[useAuth CheckAuth] Auth 檢查失敗:', error)
        throw new Error(error.message || '身份驗證失敗')
      }

      const result = await response.json()
      console.log('[useAuth CheckAuth] Auth 檢查成功:', result)

      if (result?.status === 'success' && result?.data?.user) {
        const dbUser = result.data.user
        const userData = { ...initUserData }
        
        // 將後端返回的用戶數據映射到前端用戶數據結構
        for (const key in userData) {
          if (Object.hasOwn(dbUser, key)) {
            userData[key] = dbUser[key] ?? ''
          }
        }
        
        // 安全的狀態更新
        try {
          setAuth({
            isAuth: true,
            userData,
            isLoading: false,
            error: null,
          })
        } catch (stateError) {
          console.error('[useAuth CheckAuth] 狀態更新錯誤:', stateError)
        }
        
        if (isClient) {
          localStorage.setItem('isAuthenticated', 'true')
        }
        
        console.log('[useAuth CheckAuth] 返回成功結果')
        return { status: 'success', user: userData }
      } else {
        if (isClient) {
          localStorage.removeItem('isAuthenticated')
        }
        
        setAuth({
          isAuth: false,
          userData: initUserData,
          isLoading: false,
          error: result?.message || '驗證失敗',
        })
        
        // 如果是受保護的頁面，重定向到登入頁
        if (protectedRoutes.some(route => router.pathname.startsWith(route))) {
          try {
            router.push(loginRoute)
          } catch (routerError) {
            console.error('[useAuth] Router push error:', routerError)
          }
        }
        
        console.log('[useAuth CheckAuth] 返回失敗結果')
        return { status: 'error', message: result?.message || '驗證失敗' }
      }
    } catch (error) {
      console.error('[useAuth CheckAuth] 捕獲錯誤:', error)
      
      setAuth({
        isAuth: false,
        userData: initUserData,
        isLoading: false,
        error: error.message || '驗證過程中發生錯誤',
      })
      
      if (isClient) {
        localStorage.removeItem('isAuthenticated')
      }

      console.log('[useAuth CheckAuth] 返回錯誤結果')
      return { status: 'error', message: error.message }
    }
  }

  // 安全的 handleCheckAuth 包裝器
  const safeHandleCheckAuth = async (force = false) => {
    try {
      const result = await handleCheckAuth(force)
      return result || { status: 'error', message: '未知錯誤' }
    } catch (error) {
      console.error('[useAuth] safeHandleCheckAuth 錯誤:', error)
      return { status: 'error', message: error.message || '檢查失敗' }
    }
  }

  // 初始檢查身份狀態
  useEffect(() => {
    const initialCheck = async () => {
      try {
        // 如果瀏覽器本地存儲顯示已登入，才進行驗證
        if (isClient && localStorage.getItem('isAuthenticated') === 'true') {
          console.log('[useAuth] 執行初始身份檢查')
          const result = await safeHandleCheckAuth(true) // 強制檢查
          console.log('[useAuth] 初始身份檢查完成:', result)
        } else {
          // 如果沒有本地存儲的登入狀態，直接設置為未登入狀態
          console.log('[useAuth] 無本地登入狀態，設置為未登入')
          setAuth(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        console.error('[useAuth] 初始檢查錯誤:', error)
        setAuth(prev => ({ ...prev, isLoading: false, error: error.message }))
      }
    }

    if (router.isReady) {
      initialCheck().catch((error) => {
        console.error('[useAuth] Initial check error:', error)
      })
    }
  }, [router.isReady])

  // 檢查訪問受保護的頁面
  useEffect(() => {
    const checkProtectedRoute = async () => {
      try {
        // 如果當前頁面是受保護的且用戶未登入
        if (protectedRoutes.some(route => router.pathname.startsWith(route))) {
          if (!auth.isAuth && !auth.isLoading) {
            // 本地存儲中檢查是否曾經登入過
            if (isClient && localStorage.getItem('isAuthenticated') === 'true') {
              // 嘗試驗證身份
              console.log('[useAuth] 保護路由檢查身份驗證')
              const result = await safeHandleCheckAuth(true)
              console.log('[useAuth] 保護路由檢查結果:', result)
              
              if (result && result.status !== 'success') {
                // 驗證失敗，顯示提示並重定向
                Swal.fire({
                  icon: 'warning',
                  title: '需要登入',
                  text: '請先登入以訪問此頁面',
                }).then(() => {
                  router.push(loginRoute).catch((routerError) => {
                    console.error('[useAuth] Router push error in Swal:', routerError)
                  })
                })
              }
            } else {
              // 從未登入過，直接重定向
              router.push(loginRoute).catch((routerError) => {
                console.error('[useAuth] Router push error:', routerError)
              })
            }
          }
        }
      } catch (error) {
        console.error('[useAuth] 保護路由檢查錯誤:', error)
      }
    }

    if (router.isReady && !auth.isLoading) {
      checkProtectedRoute().catch((error) => {
        console.error('[useAuth] Check protected route error:', error)
      })
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
        checkAuth: safeHandleCheckAuth,
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
