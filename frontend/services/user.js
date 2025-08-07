import useSWR from 'swr'

const BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL ||
  'https://gurulaptop-ckeditor.onrender.com'

// 統一的 API 請求處理函數
const fetchApi = async (endpoint, options = {}) => {
  try {
    console.log(`[Frontend API] 發送請求到: ${BASE_URL}${endpoint}`)
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // 重要！確保發送和接收 cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    console.log(`[Frontend API] 收到回應狀態: ${response.status}`)

    const data = await response.json()
    
    if (!response.ok) {
      console.error(`[Frontend API] 請求失敗 ${endpoint}:`, {
        status: response.status,
        data
      })
      
      if (response.status === 401) {
        // 如果是認證錯誤，清除本地存儲
        localStorage.removeItem('token')
        localStorage.removeItem('userData')
        console.log('[Frontend API] 清除認證資訊因為 401 錯誤')
      }
      throw new Error(data.message || '請求失敗')
    }
    
    console.log(`[Frontend API] 請求成功 ${endpoint}:`, data)
    return data
  } catch (error) {
    console.error(`[Frontend API] API Error (${endpoint}):`, error)
    throw error
  }
}

// 認證相關功能
export const checkAuth = async () => {
  try {
    console.log('[Frontend Auth] 開始檢查身份驗證')
    
    const response = await fetchApi('/api/auth/check', {
      method: 'GET',
      credentials: 'include', // 確保發送 cookies
    })
    
    console.log('[Frontend Auth] 身份驗證檢查成功:', response)
    return { data: response }
  } catch (error) {
    console.error('[Frontend Auth] 身份驗證檢查失敗:', error)
    
    // 如果是認證錯誤，清除本地存儲
    if (error.message === '請先登入' || error.message === '登入已過期') {
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
      console.log('[Frontend Auth] 清除本地認證資料')
    }
    throw error
  }
}

export const login = async (loginData) => {
  try {
    console.log('[Frontend Login] 準備發送登入請求:', {
      loginData,
      BASE_URL,
      endpoint: '/api/auth/login'
    })
    
    const response = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    })

    console.log('[Frontend Login] 登入回應:', response)

    // 注意：不再使用 localStorage 存儲 token
    // token 現在通過 httpOnly cookie 自動管理
    if (response.status === 'success' && response.data?.user) {
      // 只存儲用戶資料到 localStorage 作為快取
      localStorage.setItem('userData', JSON.stringify(response.data.user))
      console.log('[Frontend Login] 用戶資料已存儲到 localStorage')
    }

    return response
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

export const logout = async () => {
  try {
    console.log('[Frontend Logout] 開始登出流程')
    
    // 清除本地存儲的用戶資料
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    
    console.log('[Frontend Logout] 本地資料已清除')
    
    // 調用後端登出 API 清除 cookie
    const response = await fetchApi('/api/auth/logout', { method: 'POST' })
    
    console.log('[Frontend Logout] 登出成功:', response)
    return response
  } catch (error) {
    console.error('[Frontend Logout] Logout failed:', error)
    // 即使後端失敗，也要確保本地資料被清除
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    throw error
  }
}

// 使用者相關功能
export const getUserById = async (id) => {
  try {
    return await fetchApi(`/api/users/${id}`)
  } catch (error) {
    console.error('Get user failed:', error)
    throw error
  }
}

export const register = async (user) => {
  try {
    return await fetchApi('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(user),
    })
  } catch (error) {
    console.error('Register failed:', error)
    throw error
  }
}

export const updateProfile = async (id, user) => {
  try {
    return await fetchApi(`/api/users/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(user),
    })
  } catch (error) {
    console.error('Update profile failed:', error)
    throw error
  }
}

// 頭像上傳
export const updateProfileAvatar = async (formData) => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${BASE_URL}/api/users/upload-avatar`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || '上傳失敗')
    return data
  } catch (error) {
    console.error('Upload avatar failed:', error)
    throw error
  }
}

// JWT 處理
export const parseJwt = (token) => {
  try {
    if (!token) return null

    // 確保 token 是有效的字符串
    if (typeof token !== 'string') {
      console.error('Invalid token format')
      return null
    }

    // 檢查 token 是否包含必要的部分
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format')
      return null
    }

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

    // 使用 try-catch 專門處理 atob 部分
    let decodedData
    try {
      decodedData = window.atob(base64)
    } catch (e) {
      console.error('Failed to decode base64:', e)
      return null
    }

    // 更安全的方式處理 URI 編碼
    try {
      const jsonPayload = decodeURIComponent(
        Array.from(decodedData)
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (e) {
      console.error('Failed to parse payload:', e)
      return null
    }
  } catch (error) {
    console.error('Parse JWT failed:', error)
    return null
  }
}

// 添加缺少的功能
export const updatePassword = async (data) => {
  try {
    return await fetchApi('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error('Update password failed:', error)
    throw error
  }
}

export const requestOtpToken = async (email) => {
  try {
    return await fetchApi('/api/auth/otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  } catch (error) {
    console.error('Request OTP failed:', error)
    throw error
  }
}

export const resetPassword = async (data) => {
  try {
    return await fetchApi('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  } catch (error) {
    console.error('Reset password failed:', error)
    throw error
  }
}

// 社群登入相關
export const googleLogin = async (token) => {
  try {
    return await fetchApi('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  } catch (error) {
    console.error('Google login failed:', error)
    throw error
  }
}

export const lineLoginRequest = async () => {
  try {
    return await fetchApi('/api/auth/line/login', { method: 'GET' })
  } catch (error) {
    console.error('Line login request failed:', error)
    throw error
  }
}

export const lineLoginCallback = async (code) => {
  try {
    return await fetchApi('/api/auth/line/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  } catch (error) {
    console.error('Line login callback failed:', error)
    throw error
  }
}

export const lineLogout = async () => {
  try {
    return await fetchApi('/api/auth/line/logout', { method: 'POST' })
  } catch (error) {
    console.error('Line logout failed:', error)
    throw error
  }
}

// 收藏相關
export const addFav = async (productId) => {
  try {
    return await fetchApi('/api/user/favorites', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    })
  } catch (error) {
    console.error('Add favorite failed:', error)
    throw error
  }
}

export const removeFav = async (productId) => {
  try {
    return await fetchApi(`/api/user/favorites/${productId}`, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('Remove favorite failed:', error)
    throw error
  }
}
