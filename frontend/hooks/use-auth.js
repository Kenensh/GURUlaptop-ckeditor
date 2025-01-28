import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import { checkAuth } from '@/services/user'

const AuthContext = createContext(null)

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
  })

  const router = useRouter()

  // 登入頁路由
  const loginRoute = '/member/login'
  // 隱私頁面路由
  const protectedRoutes = ['/dashboard', '/coupon/coupon-user']

  const login = async (email, password) => {
    try {
      const response = await fetch('api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()
      if (result.status === 'success') {
        setAuth({
          isAuth: true,
          userData: result.data,
        })
      }
    } catch (error) {
      console.error('登入失敗：', error)
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

      if (!response.ok) {
        throw new Error('登出失敗')
      }
      const result = await response.json()

      if (result.status === 'success') {
        await Promise.all([
          router.push('/member/login'),
          new Promise((resolve) => {
            setAuth({
              isAuth: false,
              userData: initUserData,
            })
            resolve()
          }),
        ])
      }
    } catch (error) {
      console.error('登出錯誤:', error)
    }
  }

  const handleCheckAuth = async () => {
    const res = await checkAuth()

    if (res.data.status === 'success') {
      const dbUser = res.data.data.user
      const userData = { ...initUserData }

      for (const key in userData) {
        if (Object.hasOwn(dbUser, key)) {
          userData[key] = dbUser[key] || ''
        }
      }
      setAuth({ isAuth: true, userData })
    } else {
      console.warn(res.data)
      if (protectedRoutes.includes(router.pathname)) {
        router.push(loginRoute)
      }
    }
  }

  useEffect(() => {
    if (router.isReady && !auth.isAuth) {
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default useAuth
