import useSWR from 'swr'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://gurulaptop-ckeditor.onrender.com'

const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || '請求失敗')
  return data
}

export const checkAuth = async () => {
  try {
    return await fetchApi('/api/auth/check', { method: 'GET' })
  } catch (error) {
    throw error
  }
}

export const login = (loginData) =>
  fetchApi('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(loginData),
  })

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userData')
  return fetchApi('/api/auth/logout', { method: 'POST' })
}

// 其他函數保持不變,但移除 credentials: 'include'
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

export const updateProfileAvatar = async (formData) => {
  const token = localStorage.getItem('token')
  const response = await fetch(`${BACKEND_URL}/users/upload-avatar`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  })
  return response.json()
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
