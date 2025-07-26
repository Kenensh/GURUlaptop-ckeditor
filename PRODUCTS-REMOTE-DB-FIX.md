# Products 功能完整修復指南 - 遠端資料庫版

## 🎯 問題分析

### 發現的問題
1. **資料庫連接路徑錯誤** - `products.js` 使用了錯誤的別名 `##/configs/db.js`
2. **API 路徑不匹配** - 前端調用 `/api/products`，後端端點是 `/api/products/list`
3. **分頁參數不一致** - 前端傳送 `perpage`，後端未處理
4. **可能缺少產品資料** - 遠端資料庫可能需要種子資料

## ✅ 已完成的修復

### 1. 修正資料庫連接路徑
```javascript
// 修復前 (products.js)
import { pool } from '##/configs/db.js'

// 修復後
import { pool } from '#configs/db.js'
```

### 2. 修正前端 API 路徑
```javascript
// 修復前 (frontend/services/api/product.js)
const response = await axiosInstance.get(`/api/products?${searchParams.toString()}`);

// 修復後
const response = await axiosInstance.get(`/api/products/list?${searchParams.toString()}`);
```

### 3. 加入分頁參數支援
```javascript
// 修復前 (backend/routes/products.js)
const { page = 1, category, category_value, price, search } = req.query
const limit = 12

// 修復後
const { page = 1, perpage = 12, category, category_value, price, search } = req.query
const limit = parseInt(perpage) || 12
```

## 🗄️ 遠端資料庫配置確認

### 資料庫連接資訊 (已正確配置)
- **Host**: dpg-ctjcfrtsvqrc7387r9og-a.singapore-postgres.render.com
- **Database**: project_db_qbv8
- **SSL**: 啟用 (rejectUnauthorized: false)
- **Pool**: 最大 20 連線

### 種子資料文件
- `seeds/Product.json` - 14,003 行產品資料
- `seeds/Brand.json` - 品牌資料
- `seeds/Category.json` - 分類資料
- `seeds/Product_Color.json` - 產品顏色
- `seeds/Product_Size.json` - 產品尺寸

## 🚀 部署與測試步驟

### 1. 初始化遠端資料庫資料
```bash
# 執行種子資料匯入 (會重建表格並匯入所有資料)
npm run seed
```

### 2. 啟動後端服務
```bash
# 啟動開發服務
npm run dev
```

### 3. 測試 API 端點
```bash
# 基本產品列表
curl "http://localhost:3005/api/products/list"

# 帶分頁的產品列表
curl "http://localhost:3005/api/products/list?page=1&perpage=5"

# 搜尋產品
curl "http://localhost:3005/api/products/list?search=laptop"

# 單一產品詳情
curl "http://localhost:3005/api/products/1"

# 產品卡片資料
curl "http://localhost:3005/api/products/card/1"
```

### 4. 執行自動化測試
```bash
# 檢查遠端資料庫狀態
node check-remote-products.js

# 快速產品資料檢查
node simple-product-check.js

# 完整 API 測試
node test-products-remote.js
```

## 📊 預期的 API 回應格式

### 產品列表 (`/api/products/list`)
```json
{
  "status": "success",
  "data": {
    "products": [
      {"product_id": 1},
      {"product_id": 2}
    ],
    "totalPages": 5
  }
}
```

### 單一產品 (`/api/products/:id`)
```json
{
  "status": "success",
  "data": {
    "product": {
      "product_id": 1,
      "product_name": "Modern Frozen Salad - PUMA 慢跑鞋",
      "list_price": 1600,
      "product_img": [...],
      "product_detail_img": [...]
    }
  }
}
```

## 🛠️ 故障排除

### 如果遇到 "找不到商品" 錯誤
1. 確認種子資料已匯入: `npm run seed`
2. 檢查遠端資料庫連接: `node simple-product-check.js`
3. 確認產品資料有效: 檢查 `valid = true` 的產品

### 如果遇到連接錯誤
1. 檢查網路連接
2. 確認遠端資料庫服務正常
3. 檢查防火牆設定

### 如果 API 回應空資料
1. 檢查查詢參數是否正確
2. 確認資料庫表格結構
3. 檢查 SQL 查詢語法

## 🔄 前後端完全對齊確認

### 後端端點
- ✅ `/api/products/list` - 產品列表 (支援 perpage)
- ✅ `/api/products/:id` - 單一產品
- ✅ `/api/products/card/:id` - 產品卡片
- ✅ `/api/products/related/:id` - 相關產品

### 前端調用
- ✅ `getProducts()` - 調用 `/api/products/list`
- ✅ `useProduct()` - SWR Hook 使用正確路徑
- ✅ `useProductMore()` - 無限滾動使用正確路徑

## 📝 測試清單

- [ ] 種子資料匯入成功
- [ ] 後端服務啟動正常
- [ ] 遠端資料庫連接成功
- [ ] 產品列表 API 正常
- [ ] 分頁功能正常
- [ ] 搜尋功能正常
- [ ] 單一產品 API 正常
- [ ] 前端頁面顯示正常

## 🎉 預期結果

修復完成後，Products 功能應該：
1. 正確連接到遠端 PostgreSQL 資料庫
2. 前後端 API 完全對齊
3. 分頁、搜尋、篩選功能正常
4. 產品詳情頁正常顯示
5. 圖片資料正確載入

---

**修復狀態**: ✅ 程式碼修復完成  
**資料狀態**: ⏳ 需要執行種子資料  
**測試狀態**: ⏳ 需要啟動服務測試  
**優先級**: 🔥 高優先級
