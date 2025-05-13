import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

/**
 * 創建新訂單
 * @param {Object} orderData - 訂單資料
 * @returns {Promise}
 */
export const createOrder = async (orderData) => {
  try {
    const response = await axiosInstance.post('/api/orders', orderData);
    return response.data;
  } catch (error) {
    return handleApiError(error, '創建訂單失敗');
  }
};

/**
 * 獲取訂單詳情
 * @param {string} orderId - 訂單 ID
 * @returns {Promise}
 */
export const getOrderById = async (orderId) => {
  try {
    const response = await axiosInstance.get(`/api/orders/${orderId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取訂單詳情失敗');
  }
};

/**
 * 獲取使用者訂單列表
 * @param {string} userId - 使用者 ID
 * @param {Object} filters - 篩選條件
 * @returns {Promise}
 */
export const getUserOrders = async (userId, filters = {}) => {
  try {
    // 建立查詢參數
    const queryParams = new URLSearchParams();
    
    // 處理篩選條件
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const response = await axiosInstance.get(`/api/users/${userId}/orders?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取訂單列表失敗');
  }
};

/**
 * 取消訂單
 * @param {string} orderId - 訂單 ID
 * @param {Object} data - 取消原因等資料
 * @returns {Promise}
 */
export const cancelOrder = async (orderId, data = {}) => {
  try {
    const response = await axiosInstance.put(`/api/orders/${orderId}/cancel`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error, '取消訂單失敗');
  }
};

/**
 * 更新訂單狀態
 * @param {string} orderId - 訂單 ID
 * @param {Object} data - 狀態資料
 * @returns {Promise}
 */
export const updateOrderStatus = async (orderId, data) => {
  try {
    const response = await axiosInstance.put(`/api/orders/${orderId}/status`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error, '更新訂單狀態失敗');
  }
};

/**
 * 提交訂單付款資訊
 * @param {string} orderId - 訂單 ID
 * @param {Object} paymentData - 付款資料
 * @returns {Promise}
 */
export const submitPayment = async (orderId, paymentData) => {
  try {
    const response = await axiosInstance.post(`/api/orders/${orderId}/payment`, paymentData);
    return response.data;
  } catch (error) {
    return handleApiError(error, '提交付款資訊失敗');
  }
};

/**
 * 產生 LINE Pay 付款連結
 * @param {string} orderId - 訂單 ID
 * @returns {Promise}
 */
export const generateLinePayLink = async (orderId) => {
  try {
    const response = await axiosInstance.post(`/api/orders/${orderId}/line-pay`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '產生 LINE Pay 付款連結失敗');
  }
};

/**
 * 處理 LINE Pay 付款回調
 * @param {Object} params - 回調參數
 * @returns {Promise}
 */
export const handleLinePayCallback = async (params) => {
  try {
    const response = await axiosInstance.get('/api/line-pay/confirm', { params });
    return response.data;
  } catch (error) {
    return handleApiError(error, '處理 LINE Pay 付款回調失敗');
  }
};

/**
 * 獲取訂單的發票資訊
 * @param {string} orderId - 訂單 ID
 * @returns {Promise}
 */
export const getOrderInvoice = async (orderId) => {
  try {
    const response = await axiosInstance.get(`/api/orders/${orderId}/invoice`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取發票資訊失敗');
  }
};

/**
 * 更新訂單發票資訊
 * @param {string} orderId - 訂單 ID
 * @param {Object} invoiceData - 發票資料
 * @returns {Promise}
 */
export const updateOrderInvoice = async (orderId, invoiceData) => {
  try {
    const response = await axiosInstance.put(`/api/orders/${orderId}/invoice`, invoiceData);
    return response.data;
  } catch (error) {
    return handleApiError(error, '更新發票資訊失敗');
  }
};
