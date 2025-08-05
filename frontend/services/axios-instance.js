import axios from 'axios';

const isClient = typeof window !== 'undefined';

// 使用環境變數定義基本 URL
const BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3005' 
    : 'https://gurulaptop-ckeditor.onrender.com');

    
// 創建 axios 實例
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// 請求攔截器 - 添加 token
axiosInstance.interceptors.request.use((config) => {
  // 確保跨域請求可以帶上 cookies
  config.withCredentials = true;
  
  // 如果在客戶端且存在 token，添加到 headers
  if (isClient) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 響應攔截器 - 處理認證和重整 token
axiosInstance.interceptors.response.use(
  (response) => {
    // 檢查是否需要更新 token
    const newToken = response.headers['authorization'] || response.headers['Authorization'];
    if (isClient && newToken && newToken.startsWith('Bearer ')) {
      const token = newToken.split(' ')[1];
      localStorage.setItem('token', token);
    }
    
    return response;
  },
  (error) => {
    // 處理 401 未授權錯誤 - 登出並重定向到登入頁面
    if (error.response?.status === 401) {
      if (isClient) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        // 只有在非登入頁面才重定向，避免無限迴圈
        if (!window.location.pathname.includes('/member/login')) {
          window.location.href = '/member/login';
        }
      }
    }
    
    // 其他錯誤，直接拒絕 Promise
    return Promise.reject(error);
  }
);

// 通用 fetcher 函數，用於 SWR
export const fetcher = async (url) => {
  const response = await axiosInstance.get(url);
  return response.data;
};

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
