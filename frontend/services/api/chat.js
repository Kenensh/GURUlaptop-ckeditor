import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

/**
 * 獲取聊天室列表
 * @returns {Promise}
 */
export const getChatRooms = async () => {
  try {
    const response = await axiosInstance.get('/api/chat/rooms');
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取聊天室列表失敗');
  }
};

/**
 * 獲取特定聊天室
 * @param {string} roomId - 聊天室 ID
 * @returns {Promise}
 */
export const getChatRoom = async (roomId) => {
  try {
    const response = await axiosInstance.get(`/api/chat/rooms/${roomId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取聊天室失敗');
  }
};

/**
 * 創建新聊天室
 * @param {Object} roomData - 聊天室資料
 * @returns {Promise}
 */
export const createChatRoom = async (roomData) => {
  try {
    const response = await axiosInstance.post('/api/chat/rooms', roomData);
    return response.data;
  } catch (error) {
    return handleApiError(error, '創建聊天室失敗');
  }
};

/**
 * 獲取聊天訊息
 * @param {string} roomId - 聊天室 ID
 * @param {number} page - 頁碼
 * @param {number} limit - 每頁限制
 * @returns {Promise}
 */
export const getChatMessages = async (roomId, page = 1, limit = 50) => {
  try {
    const response = await axiosInstance.get(`/api/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取聊天訊息失敗');
  }
};

/**
 * 發送聊天訊息
 * @param {string} roomId - 聊天室 ID
 * @param {Object} messageData - 訊息資料
 * @returns {Promise}
 */
export const sendChatMessage = async (roomId, messageData) => {
  try {
    const response = await axiosInstance.post(`/api/chat/rooms/${roomId}/messages`, messageData);
    return response.data;
  } catch (error) {
    return handleApiError(error, '發送訊息失敗');
  }
};

/**
 * 上傳聊天圖片
 * @param {string} roomId - 聊天室 ID
 * @param {FormData} formData - 包含圖片的表單數據
 * @returns {Promise}
 */
export const uploadChatImage = async (roomId, formData) => {
  try {
    const response = await axiosInstance.post(`/api/chat/rooms/${roomId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, '上傳圖片失敗');
  }
};

/**
 * 將訊息標記為已讀
 * @param {string} roomId - 聊天室 ID
 * @param {Object} data - 標記資料
 * @returns {Promise}
 */
export const markMessagesAsRead = async (roomId, data) => {
  try {
    const response = await axiosInstance.put(`/api/chat/rooms/${roomId}/messages/read`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error, '標記訊息已讀失敗');
  }
};

/**
 * 獲取特定用戶的未讀訊息計數
 * @param {string} userId - 用戶 ID
 * @returns {Promise}
 */
export const getUnreadMessageCount = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/chat/users/${userId}/unread`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取未讀訊息計數失敗');
  }
};
