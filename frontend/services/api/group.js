import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

/**
 * 獲取所有團購活動
 * @param {Object} filters - 篩選條件
 * @param {number} page - 頁碼
 * @param {number} perpage - 每頁項目數
 * @returns {Promise}
 */
export const getAllGroups = async (filters = {}, page = 1, perpage = 10) => {
  try {
    // 建立查詢參數
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('perpage', perpage);
    
    // 處理篩選條件
    if (filters.searchText) queryParams.append('search', filters.searchText);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.category) queryParams.append('category', filters.category);
    
    const response = await axiosInstance.get(`/api/group?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取團購活動失敗');
  }
};

/**
 * 獲取團購詳情
 * @param {string} id - 團購 ID
 * @returns {Promise}
 */
export const getGroupById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/group/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取團購詳情失敗');
  }
};

/**
 * 創建新團購活動
 * @param {Object} groupData - 團購資料
 * @returns {Promise}
 */
export const createGroup = async (groupData) => {
  try {
    const response = await axiosInstance.post('/api/group', groupData);
    return response.data;
  } catch (error) {
    return handleApiError(error, '創建團購活動失敗');
  }
};

/**
 * 更新團購活動
 * @param {string} id - 團購 ID
 * @param {Object} groupData - 團購資料
 * @returns {Promise}
 */
export const updateGroup = async (id, groupData) => {
  try {
    const response = await axiosInstance.put(`/api/group/${id}`, groupData);
    return response.data;
  } catch (error) {
    return handleApiError(error, '更新團購活動失敗');
  }
};

/**
 * 刪除團購活動
 * @param {string} id - 團購 ID
 * @returns {Promise}
 */
export const deleteGroup = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/group/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '刪除團購活動失敗');
  }
};

/**
 * 參與團購
 * @param {string} groupId - 團購 ID
 * @param {Object} data - 參與資料
 * @returns {Promise}
 */
export const joinGroup = async (groupId, data) => {
  try {
    const response = await axiosInstance.post(`/api/group/${groupId}/join`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error, '參與團購失敗');
  }
};

/**
 * 取消參與團購
 * @param {string} groupId - 團購 ID
 * @param {string} orderId - 訂單 ID
 * @returns {Promise}
 */
export const leaveGroup = async (groupId, orderId) => {
  try {
    const response = await axiosInstance.delete(`/api/group/${groupId}/order/${orderId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '取消參與團購失敗');
  }
};

/**
 * 獲取用戶參與的團購
 * @param {string} userId - 用戶 ID
 * @returns {Promise}
 */
export const getUserGroups = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/user/${userId}/groups`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取用戶團購失敗');
  }
};
