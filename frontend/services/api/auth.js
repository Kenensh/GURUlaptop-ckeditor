import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

const isClient = typeof window !== 'undefined';

/**
 * 登入功能
 * @param {Object} loginData - 包含 email 和 password 的物件
 * @returns {Promise}
 */
export const login = async (loginData) => {
  try {
    const response = await axiosInstance.post('/api/auth/login', loginData);
    
    if (isClient && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    return handleApiError(error, '登入失敗');
  }
};

/**
 * 檢查使用者是否已登入
 * @returns {Promise}
 */
export const checkAuth = async () => {
  try {
    const response = await axiosInstance.get('/api/auth/check');
    return response.data;
  } catch (error) {
    // 如果是認證錯誤，清除本地存儲
    if (isClient && (error.response?.status === 401 || error.response?.data?.message === '請先登入' || error.response?.data?.message === '登入已過期')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
    return handleApiError(error, '認證檢查失敗');
  }
};

/**
 * 登出功能
 * @returns {Promise}
 */
export const logout = async () => {
  try {
    if (isClient) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
    
    const response = await axiosInstance.post('/api/auth/logout');
    return response.data;
  } catch (error) {
    return handleApiError(error, '登出失敗');
  }
};

/**
 * 註冊功能
 * @param {Object} userData - 使用者資料
 * @returns {Promise}
 */
export const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/api/auth/signup', userData);
    return response.data;
  } catch (error) {
    return handleApiError(error, '註冊失敗');
  }
};

/**
 * 請求重設密碼 OTP
 * @param {string} email - 使用者電子郵件
 * @returns {Promise}
 */
export const requestOtpToken = async (email) => {
  try {
    const response = await axiosInstance.post('/api/auth/otp', { email });
    return response.data;
  } catch (error) {
    return handleApiError(error, '請求 OTP 失敗');
  }
};

/**
 * 重設密碼
 * @param {Object} data - 包含 OTP 和新密碼的物件
 * @returns {Promise}
 */
export const resetPassword = async (data) => {
  try {
    const response = await axiosInstance.post('/api/auth/reset-password', data);
    return response.data;
  } catch (error) {
    return handleApiError(error, '重設密碼失敗');
  }
};

/**
 * Google 登入
 * @param {string} token - Google 登入令牌
 * @returns {Promise}
 */
export const googleLogin = async (token) => {
  try {
    const response = await axiosInstance.post('/api/auth/google', { token });
    
    if (isClient && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Google 登入失敗');
  }
};

/**
 * Line 登入請求
 * @returns {Promise}
 */
export const lineLoginRequest = async () => {
  try {
    const response = await axiosInstance.get('/api/auth/line/login');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Line 登入請求失敗');
  }
};

/**
 * Line 登入回調
 * @param {string} code - Line 授權碼
 * @returns {Promise}
 */
export const lineLoginCallback = async (code) => {
  try {
    const response = await axiosInstance.post('/api/auth/line/callback', { code });
    
    if (isClient && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Line 登入回調失敗');
  }
};

/**
 * Line 登出
 * @returns {Promise}
 */
export const lineLogout = async () => {
  try {
    const response = await axiosInstance.post('/api/auth/line/logout');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Line 登出失敗');
  }
};
