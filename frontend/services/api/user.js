import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

/**
 * 獲取使用者資訊
 * @param {string} id - 使用者 ID
 * @returns {Promise}
 */
export const getUserById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取使用者資訊失敗');
  }
};

/**
 * 更新使用者個人資料
 * @param {string} id - 使用者 ID
 * @param {Object} userData - 使用者資料
 * @returns {Promise}
 */
export const updateProfile = async (id, userData) => {
  try {
    const response = await axiosInstance.put(`/api/users/${id}/profile`, userData);
    return response.data;
  } catch (error) {
    return handleApiError(error, '更新個人資料失敗');
  }
};

/**
 * 更新使用者頭像
 * @param {string} id - 使用者 ID
 * @param {FormData} formData - 包含圖片的表單資料
 * @returns {Promise}
 */
export const updateAvatar = async (id, formData) => {
  try {
    const response = await axiosInstance.post(`/api/users/${id}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, '更新頭像失敗');
  }
};

/**
 * 更新使用者密碼
 * @param {Object} data - 包含當前密碼和新密碼的物件
 * @returns {Promise}
 */
export const updatePassword = async (data) => {
  try {
    const response = await axiosInstance.put('/api/users/password', data);
    return response.data;
  } catch (error) {
    return handleApiError(error, '更新密碼失敗');
  }
};

/**
 * 獲取使用者會員等級資訊
 * @param {string} id - 使用者 ID
 * @returns {Promise}
 */
export const getMembershipData = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/membership/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取會員等級資訊失敗');
  }
};

/**
 * 獲取使用者訂單歷史
 * @param {string} id - 使用者 ID
 * @returns {Promise}
 */
export const getOrderHistory = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/buy-list/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取訂單歷史失敗');
  }
};
