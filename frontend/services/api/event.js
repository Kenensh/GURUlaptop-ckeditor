import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

/**
 * 獲取所有活動
 * @returns {Promise}
 */
export const getAllEvents = async () => {
  try {
    const response = await axiosInstance.get('/api/event');
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取活動列表失敗');
  }
};

/**
 * 獲取活動詳情
 * @param {string} id - 活動 ID
 * @returns {Promise}
 */
export const getEventById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/event/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取活動詳情失敗');
  }
};

/**
 * 獲取活動產品
 * @param {string} eventId - 活動 ID
 * @returns {Promise}
 */
export const getEventProducts = async (eventId) => {
  try {
    const response = await axiosInstance.get(`/api/event/${eventId}/products`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取活動產品失敗');
  }
};

/**
 * 使用者參與活動
 * @param {string} eventId - 活動 ID
 * @param {Object} data - 參與資料
 * @returns {Promise}
 */
export const joinEvent = async (eventId, data) => {
  try {
    const response = await axiosInstance.post(`/api/event/${eventId}/join`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error, '參與活動失敗');
  }
};

/**
 * 取消參與活動
 * @param {string} eventId - 活動 ID
 * @returns {Promise}
 */
export const leaveEvent = async (eventId) => {
  try {
    const response = await axiosInstance.delete(`/api/event/${eventId}/leave`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '取消參與活動失敗');
  }
};
