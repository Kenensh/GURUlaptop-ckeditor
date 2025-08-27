import axios from 'axios';

const isClient = typeof window !== 'undefined';

// 使用環境變數定義基本 URL
const BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://gurulaptop-ckeditor.onrender.com'  // 生產環境後端網址
    : 'http://localhost:3005')  // 開發環境


// 創建 axios 實例
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// 請求攔截器 - 確保 credentials 設定
axiosInstance.interceptors.request.use((config) => {
  // 確保跨域請求可以帶上 cookies
  config.withCredentials = true;
  
  console.log(`[Axios] 發送請求到: ${config.baseURL}${config.url}`, {
    method: config.method,
    withCredentials: config.withCredentials,
    hasAuthHeader: !!config.headers.Authorization
  });
  
  return config;
}, (error) => {
  console.error('[Axios] 請求攔截器錯誤:', error);
  return Promise.reject(error);
});

// 響應攔截器 - 處理認證錯誤
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[Axios] 收到回應: ${response.status}`, {
      url: response.config.url,
      status: response.status,
      hasData: !!response.data
    });
    
    return response;
  },
  (error) => {
    console.error(`[Axios] 響應錯誤:`, {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });
    
    // 處理 401 未授權錯誤 - 清除本地資料但不自動重定向
    if (error.response?.status === 401) {
      if (isClient) {
        console.log('[Axios] 清除本地認證資料因為 401 錯誤');
        // 清除本地存儲
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
    }
    
    // 直接拒絕 Promise，讓呼叫者處理錯誤
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
