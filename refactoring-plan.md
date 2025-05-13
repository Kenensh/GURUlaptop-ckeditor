# MFEE57-laptopGuru-ckeditor 專案重構計畫

## 專案分析

在分析 MFEE57-laptopGuru-ckeditor 專案後，發現了以下需要改進的問題：

### 前端問題

1. **API 呼叫模式不一致**：
   - 直接使用 `fetch` 和 `axios` 的混合使用
   - 硬編碼的 API URLs 散落在各個組件中
   - 沒有統一的錯誤處理機制

2. **SCSS 管理混亂**：
   - 同時使用 .scss 和 .module.scss 但沒有明確的區分準則
   - 類名（class names）命名不一致
   - 樣式重複定義在多個文件中
   - Legacy JS API deprecation warnings

3. **專案結構欠缺組織**：
   - 組件和頁面的關係不明確
   - 功能邏輯散落在各個文件中
   - 缺乏適當的抽象和模組化

4. **環境配置管理**：
   - 環境變數使用不一致
   - 開發和生產環境配置混在一起

## 重構計畫

### 階段一：API 服務層改進

1. **建立集中式 API 服務層**：

```javascript
// 檔案: /services/api/index.js
import axiosInstance from '../axios-instance';

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
```

2. **改進 axios 實例**：

```javascript
// 檔案: /services/axios-instance.js
import axios from 'axios';

const isClient = typeof window !== 'undefined';

// 使用環境變數定義基本 URL
const BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3005' 
    : 'https://gurulaptop-ckeditor.onrender.com');

// 創建 axios 實例
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// 請求攔截器 - 添加 token
axiosInstance.interceptors.request.use((config) => {
  // 確保跨域請求可以帶上 cookies
  config.withCredentials = true;
  
  // 如果在客戶端且存在 token，添加到 headers
  if (isClient) {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 響應攔截器 - 處理認證和重整 token
axiosInstance.interceptors.response.use(
  (response) => {
    // 檢查是否需要更新 token
    const newToken = response.headers['authorization'] || response.headers['Authorization'];
    if (isClient && newToken && newToken.startsWith('Bearer ')) {
      const token = newToken.split(' ')[1];
      localStorage.setItem('token', token);
    }
    
    return response;
  },
  (error) => {
    // 處理 401 未授權錯誤 - 登出並重定向到登入頁面
    if (error.response?.status === 401) {
      if (isClient) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        // 只有在非登入頁面才重定向，避免無限迴圈
        if (!window.location.pathname.includes('/member/login')) {
          window.location.href = '/member/login';
        }
      }
    }
    
    // 其他錯誤，直接拒絕 Promise
    return Promise.reject(error);
  }
);

export default axiosInstance;

// 通用 fetcher 函數，用於 SWR
export const fetcher = async (url) => {
  const response = await axiosInstance.get(url);
  return response.data;
};
```

3. **為每個功能模塊創建 API 服務文件**：

例如，auth.js 服務文件：

```javascript
// 檔案: /services/api/auth.js
import axiosInstance from '../axios-instance';
import { handleApiError } from './index';

const isClient = typeof window !== 'undefined';

/**
 * 登入功能
 * @param {Object} loginData - 包含 email 和 password 的物件
 * @returns {Promise}
 */
export const login = async (loginData) => {
  try {
    const response = await axiosInstance.post('/api/auth/login', loginData);
    
    if (isClient && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    return handleApiError(error, '登入失敗');
  }
};

/**
 * 檢查使用者是否已登入
 * @returns {Promise}
 */
export const checkAuth = async () => {
  try {
    const response = await axiosInstance.get('/api/auth/check');
    return response.data;
  } catch (error) {
    // 如果是認證錯誤，清除本地存儲
    if (isClient && (error.response?.status === 401 || error.response?.data?.message === '請先登入' || error.response?.data?.message === '登入已過期')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
    return handleApiError(error, '認證檢查失敗');
  }
};

/**
 * 登出功能
 * @returns {Promise}
 */
export const logout = async () => {
  try {
    if (isClient) {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
    
    const response = await axiosInstance.post('/api/auth/logout');
    return response.data;
  } catch (error) {
    return handleApiError(error, '登出失敗');
  }
};

// ... 其他認證相關功能
```

### 階段二：SCSS 模組化和清理

1. **建立 SCSS 變數和混合器共享文件**：

```scss
// 檔案: /styles/variables.scss

// 顏色
$primary: #805af5;
$secondary: #b4b4b4;
$success: #457db2;
$danger: #ffeb36;
$main-color: #805af5;

// 漸層
$linear-gradient-1: linear-gradient(180deg, #9474f7 0%, #573da7 100%);
$linear-gradient-2: linear-gradient(180deg, #8770fd 0%, #5848b3 100%);
$linear-gradient-3: linear-gradient(180deg, #a793e9 0%, #423db0 50%, #2e256a 100%);
$linear-gradient-4: linear-gradient(180deg, #a660d7 0%, #5b35aa 50%, #281c72 100%);
$linear-gradient-5: linear-gradient(180deg, #6552c6 0%, #1d1a64 50%, #00013a 100%);
$linear-gradient-6: linear-gradient(270deg, #8678c9 0%, #00013a 49%, #00013a 100%);
$linear-gradient-7: linear-gradient(270deg, #a793e9 0%, #5346b6 35%, #34246d 70%, #271948 100%);

// 字體
$font-family-base: 'Noto Sans TC', sans-serif;
$font-size-base: 1rem;
$font-weight-normal: 400;
$font-weight-bold: 700;

// 斷點
$breakpoint-sm: 576px;
$breakpoint-md: 768px;
$breakpoint-lg: 992px;
$breakpoint-xl: 1200px;
$breakpoint-xxl: 1400px;

// 間距
$spacing-1: 0.25rem;
$spacing-2: 0.5rem;
$spacing-3: 1rem;
$spacing-4: 1.5rem;
$spacing-5: 3rem;

// 陰影
$box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
$box-shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
$box-shadow-lg: 0 1rem 3rem rgba(0, 0, 0, 0.175);

// 邊框
$border-radius: 0.25rem;
$border-radius-lg: 0.5rem;
$border-radius-sm: 0.2rem;
```

```scss
// 檔案: /styles/mixins.scss
@import './variables.scss';

// 響應式斷點
@mixin respond-to($breakpoint) {
  @if $breakpoint == sm {
    @media (min-width: $breakpoint-sm) { @content; }
  }
  @else if $breakpoint == md {
    @media (min-width: $breakpoint-md) { @content; }
  }
  @else if $breakpoint == lg {
    @media (min-width: $breakpoint-lg) { @content; }
  }
  @else if $breakpoint == xl {
    @media (min-width: $breakpoint-xl) { @content; }
  }
  @else if $breakpoint == xxl {
    @media (min-width: $breakpoint-xxl) { @content; }
  }
}

// Flex 配置
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-column {
  display: flex;
  flex-direction: column;
}

// 文字截斷
@mixin text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 多行文字截斷
@mixin multi-line-truncate($lines) {
  display: -webkit-box;
  -webkit-line-clamp: $lines;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

// 陰影效果
@mixin box-shadow-hover {
  transition: box-shadow 0.3s ease;
  &:hover {
    box-shadow: $box-shadow-lg;
  }
}
```

2. **重新組織 SCSS 文件結構**：

```
/styles/
  /base/                 # 基礎樣式
    _reset.scss          # 重置樣式
    _typography.scss     # 排版樣式
    _utilities.scss      # 通用工具類
  /components/           # 組件樣式
    _buttons.scss        # 按鈕樣式
    _cards.scss          # 卡片樣式
    _forms.scss          # 表單樣式
    ...
  /layouts/              # 布局樣式
    _header.scss         # 頭部樣式
    _footer.scss         # 底部樣式
    _sidebar.scss        # 側邊欄樣式
    ...
  /pages/                # 頁面特定樣式
    _home.module.scss    # 首頁樣式
    _login.module.scss   # 登入頁樣式
    ...
  /themes/               # 主題
    _light.scss          # 亮色主題
    _dark.scss           # 暗色主題
  _variables.scss        # 變數
  _mixins.scss           # 混合器
  globals.scss           # 全局樣式導入
```

3. **將全局樣式集中到一個文件**：

```scss
// 檔案: /styles/globals.scss

// 變數和混合器
@import './variables';
@import './mixins';

// 第三方庫
@import '~bootstrap-icons/font/bootstrap-icons';
@import 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500&display=swap';

// 基礎樣式
@import './base/reset';
@import './base/typography';
@import './base/utilities';

// 組件樣式
@import './components/buttons';
@import './components/cards';
@import './components/forms';
// ... 其他組件

// 布局樣式
@import './layouts/header';
@import './layouts/footer';
@import './layouts/sidebar';
// ... 其他布局

// 全局樣式
html,
body {
  padding: 0;
  margin: 0;
  font-family: $font-family-base;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}
```

### 階段三：專案結構優化

1. **重新組織目錄結構**：

```
/frontend/
  /components/           # 共用組件
    /common/             # 通用組件（按鈕、表單等）
    /layout/             # 佈局組件（頭部、底部等）
    /product/            # 產品相關組件
    /blog/               # 部落格相關組件
    /user/               # 使用者相關組件
    /cart/               # 購物車相關組件
    ...
  /hooks/                # 自定義 hooks
  /services/             # 服務層
    /api/                # API 服務
    axios-instance.js    # Axios 實例
    ...
  /utils/                # 工具函數
  /contexts/             # React Context
  /types/                # TypeScript 類型定義
  /pages/                # Next.js 頁面
  /public/               # 公共資源
  /styles/               # 樣式文件
  ...
```

2. **重構組件以提高可重用性**：

- 將重複邏輯抽取為自定義 hooks
- 將共用 UI 元素抽取為組件
- 使用 React Context 管理全局狀態

### 階段四：代碼標準化和環境配置

1. **創建環境變數文件**：

```
# .env.local (本地開發環境)
NEXT_PUBLIC_API_URL=http://localhost:3005
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development

# .env.production (生產環境)
NEXT_PUBLIC_API_URL=https://gurulaptop-ckeditor.onrender.com
NEXT_PUBLIC_SITE_URL=https://your-production-url.com
NEXT_PUBLIC_ENV=production
```

2. **設置 ESLint 和 Prettier 配置**：

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["error", "warn"] }]
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

## 後端部分重構

### 階段一：API 標準化

1. **建立一致的錯誤處理中間件**：

```javascript
// 檔案: /backend/middlewares/error-handler.js
export default function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  // 設置預設錯誤狀態和訊息
  const status = err.status || 500;
  const message = err.message || '伺服器內部錯誤';
  
  // 返回格式化的錯誤響應
  res.status(status).json({
    status: 'error',
    code: status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
```

2. **API 響應格式標準化**：

```javascript
// 檔案: /backend/utils/api-response.js
/**
 * 成功響應
 * @param {Object} res - Express 響應對象
 * @param {Object} data - 響應數據
 * @param {string} message - 成功訊息
 * @param {number} code - 狀態碼
 */
export const success = (res, data = {}, message = '操作成功', code = 200) => {
  res.status(code).json({
    status: 'success',
    code,
    message,
    data,
  });
};

/**
 * 失敗響應
 * @param {Object} res - Express 響應對象
 * @param {string} message - 錯誤訊息
 * @param {number} code - 狀態碼
 * @param {Object} data - 額外數據
 */
export const fail = (res, message = '操作失敗', code = 400, data = {}) => {
  res.status(code).json({
    status: 'error',
    code,
    message,
    data,
  });
};
```

3. **將路由模組化**：

使用集中式路由管理：

```javascript
// 檔案: /backend/routes/index.js
import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import productRoutes from './products.js';
import blogRoutes from './blog.js';
import couponRoutes from './coupon.js';
// ... 其他路由導入

const router = express.Router();

// API 版本前綴
const API_PREFIX = '/api';

// 路由註冊
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/products`, productRoutes);
router.use(`${API_PREFIX}/blog`, blogRoutes);
router.use(`${API_PREFIX}/coupon`, couponRoutes);
// ... 其他路由註冊

// 404 處理
router.all(`${API_PREFIX}/*`, (req, res) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: `找不到路由 ${req.method} ${req.path}`,
  });
});

export default router;
```

### 階段二：數據庫交互優化

1. **建立數據訪問層 (DAL)**：

```javascript
// 檔案: /backend/models/dal/user-dal.js
import db from '../../configs/db.js';
import { compareHash, hashPassword } from '../../db-helpers/password-hash.js';

/**
 * 通過 ID 獲取使用者
 * @param {string} id - 使用者 ID
 * @returns {Promise<Object|null>}
 */
export async function getUserById(id) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE user_id = ? AND valid = 1',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('獲取使用者失敗:', error);
    throw error;
  }
}

/**
 * 通過電子郵件獲取使用者
 * @param {string} email - 使用者電子郵件
 * @returns {Promise<Object|null>}
 */
export async function getUserByEmail(email) {
  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND valid = 1',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('獲取使用者失敗:', error);
    throw error;
  }
}

/**
 * 創建新使用者
 * @param {Object} userData - 使用者資料
 * @returns {Promise<Object>}
 */
export async function createUser(userData) {
  try {
    const hashedPassword = await hashPassword(userData.password);
    
    const [result] = await db.query(
      `INSERT INTO users 
      (name, email, password, gender, birthdate, phone, country, city, district, 
      road_name, detailed_address, remarks) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.name,
        userData.email,
        hashedPassword,
        userData.gender,
        userData.birthdate,
        userData.phone,
        userData.country,
        userData.city,
        userData.district,
        userData.road_name,
        userData.detailed_address,
        userData.remarks || '',
      ]
    );
    
    return { id: result.insertId, ...userData, password: undefined };
  } catch (error) {
    console.error('創建使用者失敗:', error);
    throw error;
  }
}

// ... 其他數據庫操作
```

2. **建立服務層**：

```javascript
// 檔案: /backend/services/user-service.js
import * as userDal from '../models/dal/user-dal.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, compareHash } from '../db-helpers/password-hash.js';

/**
 * 用戶登入
 * @param {string} email - 使用者電子郵件
 * @param {string} password - 使用者密碼
 * @returns {Promise<Object>}
 */
export async function login(email, password) {
  const user = await userDal.getUserByEmail(email);
  
  if (!user) {
    throw new Error('使用者不存在');
  }
  
  const isPasswordValid = await compareHash(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('密碼不正確');
  }
  
  // 移除密碼
  delete user.password;
  
  // 生成 JWT
  const token = generateToken(user);
  
  return {
    user,
    token,
  };
}

/**
 * 用戶註冊
 * @param {Object} userData - 使用者資料
 * @returns {Promise<Object>}
 */
export async function register(userData) {
  // 檢查電子郵件是否已存在
  const existingUser = await userDal.getUserByEmail(userData.email);
  
  if (existingUser) {
    throw new Error('此電子郵件已被使用');
  }
  
  const newUser = await userDal.createUser(userData);
  
  // 生成 JWT
  const token = generateToken(newUser);
  
  return {
    user: newUser,
    token,
  };
}

// ... 其他服務
```

### 階段三：日誌系統改進

1. **使用 Winston 進行結構化日誌**：

```javascript
// 檔案: /backend/utils/logger.js
import winston from 'winston';
import 'colors';
import path from 'path';
import { fileURLToPath } from 'url';

// 獲取當前文件的目錄
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日誌格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 創建 Winston logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // 輸出所有日誌到 combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 輸出 error 及以上級別的日誌到 error.log
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 在開發環境下，也輸出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// 添加請求日誌中間件
export function loggerMiddleware(req, res, next) {
  const start = Date.now();
  
  // 請求完成後記錄日誌
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // 構建日誌數據
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      duration: `${duration}ms`,
    };
    
    // 根據響應狀態碼選擇日誌級別
    if (res.statusCode >= 500) {
      logger.error('Server error response', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Client error response', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  next();
}

export default logger;
```

## 實施計畫

### 1. 前期準備

1. **創建專案分支**：
   - 創建 `refactor` 分支，以便在不破壞主分支的情況下進行重構

2. **建立測試環境**：
   - 設置自動化測試腳本，確保重構不會破壞現有功能

### 2. 分階段實施

1. **第一階段：API 服務層**：
   - 創建 API 服務層
   - 更新 axiosInstance 和異常處理
   - 重構少量組件以使用新的 API 服務

2. **第二階段：SCSS 重組**：
   - 創建變數和混合器
   - 重新組織樣式文件
   - 標準化命名約定

3. **第三階段：組件重構**：
   - 抽取共用組件邏輯
   - 增強組件可重用性
   - 優化渲染性能

4. **第四階段：後端優化**：
   - 實現標準化的錯誤處理
   - 建立數據訪問層和服務層
   - 改進日誌系統

### 3. 測試與部署

1. **單元測試**：
   - 為新的服務層和組件編寫測試

2. **集成測試**：
   - 確保各模塊間的交互正常

3. **性能測試**：
   - 比較重構前後的性能差異

4. **分階段部署**：
   - 先在測試環境部署，驗證後再部署到生產環境

## 總結

這個重構計畫旨在解決 MFEE57-laptopGuru-ckeditor 專案中的主要問題，包括 API 呼叫模式不一致、SCSS 管理混亂、專案結構不清晰以及環境配置管理不佳等。通過分階段實施，我們可以在保證系統穩定性的同時，提高代碼質量和可維護性。

重構後的專案將具有更好的模組化、更一致的編碼風格以及更高的性能和可靠性，這將使未來的維護和功能擴展變得更加容易。
