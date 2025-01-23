import axiosInstance, { fetcher } from './axios-instance'
import useSWR from 'swr'

export const checkAuth = async () => {
  try {
    const response = await axiosInstance.get('/api/auth/check', {
      withCredentials: true,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
    })
    console.log('驗證檢查回應:', response)
    return response
  } catch (error) {
    console.error('驗證檢查錯誤:', error)
    return {
      data: {
        status: 'error',
        message: error.response?.data?.message || '驗證檢查失敗',
      },
    }
  }
}

export const login = async (loginData = {}) => {
  return await axiosInstance.post('/api/auth/login', loginData, {
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
  })
}

export const logout = async () => {
  return await axiosInstance.post(
    '/api/auth/logout',
    {},
    {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  )
}

export const getUserById = async (id = 0) => {
  return await axiosInstance.get(`/api/users/${id}`)
}
/**
 * 忘記密碼/OTP 要求一次性密碼
 */
export const requestOtpToken = async (email = '') => {
  return await axiosInstance.post('/reset-password/otp', { email })
}
/**
 * 忘記密碼/OTP 重設密碼
 */
export const resetPassword = async (email = '', password = '', token = '') => {
  return await axiosInstance.post('/reset-password/reset', {
    email,
    token,
    password,
  })
}
/**
 * 註冊用
 */
export const register = async (user = {}) => {
  return await axiosInstance.post('/users', user)
}
/**
 * 修改會員一般資料用(排除password, username, email)
 */
export const updateProfile = async (id = 0, user = {}) => {
  return await axiosInstance.put(`/users/${id}/profile`, user)
}
/**
 * 修改會員頭像用，需要用FormData
 */
export const updateProfileAvatar = async (formData) => {
  return await axiosInstance.post(`/users/upload-avatar`, formData)
}
/**
 * 修改會員密碼專用, password = { originPassword, newPassword }
 */
export const updatePassword = async (id = 0, password = {}) => {
  return await axiosInstance.put(`/users/${id}/password`, password)
}
/**
 * 獲得會員有加在我的最愛的商品id，回傳為id陣列
 */
// export const getFavs = async () => {
//   return await axiosInstance.get('/favorites')
// }
/**
 * 新增商品id在該會員的我的最愛清單中的
 */
export const addFav = async (pid) => {
  return await axiosInstance.put(`/favorites/${pid}`)
}
/**
 * 移除商品id在該會員的我的最愛清單中的
 */
export const removeFav = async (pid) => {
  return await axiosInstance.delete(`/favorites/${pid}`)
}

export const useUser = (id) => {
  const { data, error, isLoading } = useSWR(`/users/${id}`, fetcher)

  return {
    data,
    isLoading,
    isError: error,
  }
}

// 解析accessToken用的函式
export const parseJwt = (token) => {
  const base64Payload = token.split('.')[1]
  const payload = Buffer.from(base64Payload, 'base64')
  return JSON.parse(payload.toString())
}
