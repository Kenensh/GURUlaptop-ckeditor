import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Cache-Control': 'no-cache',
  },
  withCredentials: true,
})

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers = {
      ...config.headers,
      Origin: typeof window !== 'undefined' ? window.location.origin : '',
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/member/login'
    }
    return Promise.reject(error)
  }
)

export const fetcher = async (url) => {
  const response = await axiosInstance.get(url)
  return response.data
}

export const api = {
  get: (url, config = {}) =>
    axiosInstance.get(url, { ...config, withCredentials: true }),
  post: (url, data = {}, config = {}) =>
    axiosInstance.post(url, data, { ...config, withCredentials: true }),
  put: (url, data = {}, config = {}) =>
    axiosInstance.put(url, data, { ...config, withCredentials: true }),
  delete: (url, config = {}) =>
    axiosInstance.delete(url, { ...config, withCredentials: true }),
}

export default axiosInstance
