import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

/**
 * 獲取優惠券列表
 * @returns {Promise}
 */
export const getCouponList = async () => {
  try {
    const response = await axiosInstance.get('/api/coupon');
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取優惠券列表失敗');
  }
};

/**
 * 獲取使用者已領取的優惠券
 * @param {string} userId - 使用者 ID
 * @returns {Promise}
 */
export const getUserCoupons = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/coupon-user/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取使用者優惠券失敗');
  }
};

/**
 * 領取優惠券
 * @param {Object} data - 包含使用者 ID 和優惠券 ID
 * @returns {Promise}
 */
export const claimCoupon = async (data) => {
  try {
    const response = await axiosInstance.post('/api/coupon-user', data);
    return response.data;
  } catch (error) {
    return handleApiError(error, '領取優惠券失敗');
  }
};

/**
 * 使用優惠券
 * @param {string} userId - 使用者 ID
 * @param {string} couponId - 優惠券 ID
 * @param {string} orderId - 訂單 ID
 * @returns {Promise}
 */
export const useCoupon = async (userId, couponId, orderId) => {
  try {
    const response = await axiosInstance.put(`/api/coupon-user/${userId}/${couponId}`, { orderId });
    return response.data;
  } catch (error) {
    return handleApiError(error, '使用優惠券失敗');
  }
};

/**
 * 計算指定產品使用優惠券的折扣金額
 * @param {string} couponId - 優惠券 ID
 * @param {number} productPrice - 產品價格
 * @returns {Promise}
 */
export const calculateDiscount = async (couponId, productPrice) => {
  try {
    const response = await axiosInstance.post('/api/coupon/calculate', {
      couponId,
      productPrice,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, '計算折扣失敗');
  }
};
