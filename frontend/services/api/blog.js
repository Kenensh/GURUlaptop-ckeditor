import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

const BACKEND_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3005'
  : 'https://gurulaptop-ckeditor.onrender.com';

/**
 * 獲取部落格列表
 * @param {Object} filters - 篩選條件
 * @param {number} page - 頁碼
 * @param {number} itemsPerPage - 每頁項目數
 * @returns {Promise}
 */
export const getBlogList = async (filters = {}, page = 1, itemsPerPage = 6) => {
  try {
    // 建立查詢參數
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', itemsPerPage);
    
    // 處理篩選條件
    if (filters.searchText) queryParams.append('search', filters.searchText);
    if (filters.types && filters.types.length) queryParams.append('types', filters.types.join(','));
    if (filters.brands && filters.brands.length) queryParams.append('brands', filters.brands.join(','));
    
    const response = await axiosInstance.get(`/api/blog?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取部落格列表失敗');
  }
};

/**
 * 獲取部落格文章詳情
 * @param {string} blogId - 部落格文章 ID
 * @returns {Promise}
 */
export const getBlogDetail = async (blogId) => {
  try {
    const response = await axiosInstance.get(`/api/blog/blog-detail/${blogId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取部落格文章詳情失敗');
  }
};

/**
 * 獲取特定使用者的部落格文章
 * @param {string} userId - 使用者 ID
 * @returns {Promise}
 */
export const getUserBlogList = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/blog/blog_user_overview/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取使用者部落格列表失敗');
  }
};

/**
 * 獲取部落格文章評論
 * @param {string} blogId - 部落格文章 ID
 * @returns {Promise}
 */
export const getBlogComments = async (blogId) => {
  try {
    const response = await axiosInstance.get(`/api/blog/blog-comment/${blogId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '獲取部落格評論失敗');
  }
};

/**
 * 新增部落格評論
 * @param {string} blogId - 部落格文章 ID
 * @param {string} comment - 評論內容
 * @returns {Promise}
 */
export const addBlogComment = async (blogId, comment) => {
  try {
    const response = await axiosInstance.post(`/api/blog/blog-comment/${blogId}`, { comment });
    return response.data;
  } catch (error) {
    return handleApiError(error, '新增評論失敗');
  }
};

/**
 * 建立新部落格文章
 * @param {Object} blogData - 部落格文章資料
 * @param {File} imageFile - 文章封面圖片檔案
 * @returns {Promise}
 */
export const createBlog = async (blogData, imageFile) => {
  try {
    // 如果有圖片檔案，使用 FormData
    if (imageFile) {
      const formData = new FormData();
      formData.append('blog_image', imageFile);
      
      // 將部落格資料添加到 FormData
      Object.entries(blogData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      const response = await axiosInstance.post('/api/blog/blog-created', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // 沒有圖片檔案，直接發送 JSON
      const response = await axiosInstance.post('/api/blog/blog-created', blogData);
      return response.data;
    }
  } catch (error) {
    return handleApiError(error, '建立部落格文章失敗');
  }
};

/**
 * 更新部落格文章
 * @param {string} blogId - 部落格文章 ID
 * @param {Object} blogData - 部落格文章資料
 * @param {File} imageFile - 文章封面圖片檔案
 * @returns {Promise}
 */
export const updateBlog = async (blogId, blogData, imageFile) => {
  try {
    // 如果有圖片檔案，使用 FormData
    if (imageFile) {
      const formData = new FormData();
      formData.append('blog_image', imageFile);
      
      // 將部落格資料添加到 FormData
      Object.entries(blogData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      const response = await axiosInstance.put(`/api/blog/blog-user-edit/${blogId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // 沒有圖片檔案，直接發送 JSON
      const response = await axiosInstance.put(`/api/blog/blog-user-edit/${blogId}`, blogData);
      return response.data;
    }
  } catch (error) {
    return handleApiError(error, '更新部落格文章失敗');
  }
};

/**
 * 刪除部落格文章
 * @param {string} blogId - 部落格文章 ID
 * @returns {Promise}
 */
export const deleteBlog = async (blogId) => {
  try {
    const response = await axiosInstance.delete(`/api/blog/${blogId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, '刪除部落格文章失敗');
  }
};
