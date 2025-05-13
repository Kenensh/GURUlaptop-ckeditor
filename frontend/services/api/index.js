import axiosInstance from '../axios-instance';

/**
 * 集中管理所有 API 呼叫
 * 這個檔案負責導出所有 API 服務
 */

// 導入所有 API 服務
import * as auth from './auth';
import * as user from './user';
import * as product from './product';
import * as blog from './blog';
import * as coupon from './coupon';
import * as event from './event';
import * as group from './group';
import * as cart from './cart';
import * as chat from './chat';
import * as order from './order';

// 導出所有 API 服務
export default {
  auth,
  user,
  product,
  blog,
  coupon,
  event,
  group,
  cart,
  chat,
  order,
};

// 導出共用的 API 工具函數
export const fetcher = async (url) => {
  const response = await axiosInstance.get(url);
  return response.data;
};

// 統一錯誤處理函數
export const handleApiError = (error, customMessage = '操作失敗') => {
  console.error('API Error:', error);
  
  // 處理不同類型的錯誤
  if (error.response) {
    // 伺服器回傳錯誤
    return {
      success: false,
      message: error.response.data.message || customMessage,
      status: error.response.status,
    };
  } else if (error.request) {
    // 請求已經發出但沒有收到回應
    return {
      success: false,
      message: '無法連接到伺服器，請檢查您的網路連接',
      status: 0,
    };
  } else {
    // 其他錯誤
    return {
      success: false,
      message: error.message || customMessage,
      status: 0,
    };
  }
};
