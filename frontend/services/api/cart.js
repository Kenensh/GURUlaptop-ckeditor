import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

/**
 * 獲取購物車資訊
 * @param {string} userId - 使用者 ID
 * @returns {Promise}
 */
export const getCart = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/cart/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取購物車失敗');
  }
};

/**
 * 添加商品到購物車
 * @param {string} userId - 使用者 ID
 * @param {Object} item - 商品資訊
 * @returns {Promise}
 */
export const addToCart = async (userId, item) => {
  try {
    const response = await axiosInstance.post(`/api/cart/${userId}`, item);
    return response.data;
  } catch (error) {
    return handleApiError(error, '添加商品到購物車失敗');
  }
};

/**
 * 更新購物車商品數量
 * @param {string} userId - 使用者 ID
 * @param {string} itemId - 購物車項目 ID
 * @param {number} quantity - 新數量
 * @returns {Promise}
 */
export const updateCartItemQuantity = async (userId, itemId, quantity) => {
  try {
    const response = await axiosInstance.put(`/api/cart/${userId}/item/${itemId}`, {
      quantity,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, '更新購物車商品數量失敗');
  }
};

/**
 * 從購物車中移除商品
 * @param {string} userId - 使用者 ID
 * @param {string} itemId - 購物車項目 ID
 * @returns {Promise}
 */
export const removeFromCart = async (userId, itemId) => {
  try {
    const response = await axiosInstance.delete(`/api/cart/${userId}/item/${itemId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '從購物車移除商品失敗');
  }
};

/**
 * 清空購物車
 * @param {string} userId - 使用者 ID
 * @returns {Promise}
 */
export const clearCart = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/api/cart/${userId}/clear`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '清空購物車失敗');
  }
};

/**
 * 保存購物車項目以便稍後購買
 * @param {string} userId - 使用者 ID
 * @param {string} itemId - 購物車項目 ID
 * @returns {Promise}
 */
export const saveForLater = async (userId, itemId) => {
  try {
    const response = await axiosInstance.put(`/api/cart/${userId}/item/${itemId}/save`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '保存商品失敗');
  }
};

/**
 * 將保存的商品移回購物車
 * @param {string} userId - 使用者 ID
 * @param {string} itemId - 購物車項目 ID
 * @returns {Promise}
 */
export const moveToCart = async (userId, itemId) => {
  try {
    const response = await axiosInstance.put(`/api/cart/${userId}/item/${itemId}/move-to-cart`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '移動商品到購物車失敗');
  }
};

/**
 * 應用優惠券到購物車
 * @param {string} userId - 使用者 ID
 * @param {string} couponCode - 優惠券代碼
 * @returns {Promise}
 */
export const applyCoupon = async (userId, couponCode) => {
  try {
    const response = await axiosInstance.post(`/api/cart/${userId}/coupon`, {
      couponCode,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, '套用優惠券失敗');
  }
};

/**
 * 移除購物車中的優惠券
 * @param {string} userId - 使用者 ID
 * @returns {Promise}
 */
export const removeCoupon = async (userId) => {
  try {
    const response = await axiosInstance.delete(`/api/cart/${userId}/coupon`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '移除優惠券失敗');
  }
};
