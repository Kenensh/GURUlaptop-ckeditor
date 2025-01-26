import useSWR from 'swr'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://gurulaptop-ckeditor.onrender.com'
const fetchApi = async (endpoint, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || '請求失敗')
  return data
}

export const checkAuth = async () => {
  try {
    return await fetchApi('/api/auth/check', {
      method: 'GET',
      credentials: 'include',
    })
  } catch (error) {
    throw error
  }
}

export const login = (loginData) =>
  fetchApi('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(loginData),
  })
export const logout = () => fetchApi('/api/auth/logout', { method: 'POST' })

// 用戶相關的函數
export const getUserById = (id) => fetchApi(`/api/users/${id}`)
export const register = (user) =>
  fetchApi('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  })
export const updateProfile = (id, user) =>
  fetchApi(`/users/${id}/profile`, {
    method: 'PUT',
    body: JSON.stringify(user),
  })

// 檔案上傳需要特殊處理
export const updateProfileAvatar = async (formData) => {
  const response = await fetch(`${BACKEND_URL}/users/upload-avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  return response.json()
}

// 密碼重設相關
export const requestOtpToken = (email) =>
  fetchApi('/reset-password/otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
export const resetPassword = (email, password, token) =>
  fetchApi('/reset-password/reset', {
    method: 'POST',
    body: JSON.stringify({ email, password, token }),
  })

// 收藏相關
export const addFav = (pid) => fetchApi(`/favorites/${pid}`, { method: 'PUT' })
export const removeFav = (pid) =>
  fetchApi(`/favorites/${pid}`, { method: 'DELETE' })

// Hooks
export const useUser = (id) => {
  const { data, error, isLoading } = useSWR(
    id ? `/users/${id}` : null,
    fetchApi
  )
  return { data, isLoading, isError: error }
}

// JWT解析
export const parseJwt = (token) => {
  try {
    const base64Payload = token.split('.')[1]
    const payload = Buffer.from(base64Payload, 'base64')
    return JSON.parse(payload.toString())
  } catch (error) {
    return null
  }
}
