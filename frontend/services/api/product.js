import axiosInstance from '../axios-instance';
import { handleApiError } from './index';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

/**
 * 獲取產品列表
 * @param {Object} searchCriteria - 搜尋條件
 * @param {number} page - 頁數
 * @param {number} perpage - 每頁數量
 * @returns {Promise}
 */
export const getProducts = async (
  searchCriteria = {},
  page = 1,
  perpage = 10
) => {
  try {
    const searchParams = new URLSearchParams();
    
    // 加入搜尋條件
    Object.entries(searchCriteria).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    // 加入分頁條件
    searchParams.append('page', page);
    searchParams.append('perpage', perpage);
    
    const response = await axiosInstance.get(`/api/products/list?${searchParams.toString()}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取產品列表失敗');
  }
};

/**
 * 獲取產品詳細資訊
 * @param {string} id - 產品 ID
 * @returns {Promise}
 */
export const getProductById = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/products/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取產品詳細資訊失敗');
  }
};

/**
 * 獲取相關產品
 * @param {string} id - 產品 ID
 * @returns {Promise}
 */
export const getRelatedProducts = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/products/related/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取相關產品失敗');
  }
};

/**
 * 處理 SWR 的 fetch 函數
 * @param {string} url - API URL
 * @returns {Promise}
 */
export const fetchProducts = async (url) => {
  try {
    const response = await axiosInstance.get(url);
    
    if (response.data.status === 'success') {
      const { total, pageCount, products } = response.data.data;
      return {
        total,
        pageCount,
        products,
      };
    }
    
    return { total: 0, pageCount: 0, products: [] };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { total: 0, pageCount: 0, products: [] };
  }
};

/**
 * 使用 SWR 獲取產品列表 (Hook)
 * @param {Object} searchCriteria - 搜尋條件
 * @param {number} pageNow - 目前頁數
 * @param {number} perpage - 每頁數量
 * @returns {Object}
 */
export const useProduct = (searchCriteria = {}, pageNow = 1, perpage = 10) => {
  // 將搜尋條件轉換為 URL 參數
  const searchParams = new URLSearchParams();
  Object.entries(searchCriteria).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  // 使用 SWR 獲取資料
  const { data, error, isLoading } = useSWR(
    `/api/products/list?page=${pageNow}&perpage=${perpage}&${searchParams.toString()}`,
    fetchProducts
  );
  
  return {
    products: data?.products || [],
    pageCount: data?.pageCount || 0,
    total: data?.total || 0,
    error,
    isLoading,
  };
};

/**
 * 使用 SWR Infinite 獲取無限滾動產品列表 (Hook)
 * @param {Object} searchCriteria - 搜尋條件
 * @param {number} perpage - 每頁數量
 * @returns {Object}
 */
export const useProductMore = (searchCriteria = {}, perpage = 10) => {
  // 將搜尋條件轉換為 URL 參數
  const searchParams = new URLSearchParams();
  Object.entries(searchCriteria).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value);
    }
  });
  
  // 使用 SWR Infinite 獲取資料
  const { data, error, isLoading, mutate, size, setSize, isValidating } =
    useSWRInfinite((index, previousPageData) => {
      // 如果 previousPageData 為空陣列，表示已經到達末頁
      if (previousPageData && !previousPageData.length) return null;
      
      // 加入頁數和每頁數量
      return `/api/products/list?page=${index + 1}&perpage=${perpage}&${searchParams.toString()}`;
    }, fetchProducts);
  
  // 合併所有頁面的產品資料
  const products = data ? [].concat(...data.map((pageData) => pageData.products)) : [];
  
  return {
    products,
    error,
    isLoading,
    mutate,
    size,
    setSize,
    isValidating,
    isEmpty: products.length === 0,
    isReachingEnd: data && data[data.length - 1]?.products.length < perpage,
  };
};
