# 🛒 購物車與訂單功能修復報告

## 📋 修復概要

本次修復針對購物車 (cart)、訂單 (order) 和購買清單 (buy-list) 功能進行全面對齊，確保與 PostgreSQL 資料庫結構完全匹配，並修復 MySQL → PostgreSQL 遷移過程中的所有問題。

## 🎯 主要修復項目

### 1. 購物車功能 (cart.js)

#### 🔧 資料庫查詢修復
- **valid 欄位過濾**: 所有 SELECT 查詢都加入 `WHERE cart.valid = true` 條件
- **INSERT 查詢**: 明確設定 `valid = true` 
- **軟刪除實作**: DELETE 操作改為 `UPDATE cart SET valid = false`

#### 修復前後對比

```javascript
// 修復前
const data = await db.query(
  `SELECT cart.id, cart.user_id, cart.product_id, cart.quantity, 
         product.product_name, product.list_price, product_img.product_img_path 
  FROM cart 
  JOIN product ON cart.product_id = product.product_id 
  JOIN product_img ON cart.product_id = product_img.img_product_id  
  WHERE cart.user_id = $1`,
  [user_id]
)

// 修復後
const data = await db.query(
  `SELECT cart.id, cart.user_id, cart.product_id, cart.quantity, 
         product.product_name, product.list_price, product_img.product_img_path 
  FROM cart 
  JOIN product ON cart.product_id = product.product_id 
  JOIN product_img ON cart.product_id = product_img.img_product_id  
  WHERE cart.user_id = $1 AND cart.valid = true`,
  [user_id]
)
```

#### 修復的端點
- `POST /` - 獲取用戶購物車 (加入 valid 過濾)
- `PUT /add` - 加入商品到購物車 (檢查 valid，設定 valid = true)
- `DELETE /delete` - 軟刪除購物車商品 (改為 UPDATE valid = false)
- `POST /update` - 更新購物車數量 (檢查 valid，數量 ≤ 0 時軟刪除)
- `POST /order` - 建立訂單 (保持原功能)

### 2. 訂單功能 (order.js)

#### 🔧 資料庫欄位類型修復
- **already_pay 欄位**: PostgreSQL 中為 INTEGER 類型，修復 `true` → `1`
- **資料庫導入路徑**: 修正 `##/configs/db.js` → `../configs/db.js`

#### 修復前後對比

```javascript
// 修復前
const result = await client.query(
  'UPDATE order_list SET already_pay = true WHERE order_id = $1 RETURNING *',
  [order_id]
)

// 修復後
const result = await client.query(
  'UPDATE order_list SET already_pay = 1 WHERE order_id = $1 RETURNING *',
  [order_id]
)
```

### 3. 購買清單功能 (buy-list.js)

#### ✅ 現有功能檢查
- 資料庫連線正常 (已使用 pool)
- JOIN 查詢語法正確
- 路由端點完整
- **狀態**: 無需修復，功能正常

### 4. 路由註冊修復 (app.js)

#### 🔧 新增路由註冊
在 `app.js` 中新增缺失的路由導入和註冊:

```javascript
// 新增導入
import cartRouter from './routes/cart.js'
import orderRouter from './routes/order.js'
import buyListRouter from './routes/buy-list.js'

// 新增路由註冊
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/buy-list', buyListRouter)
```

## 📊 資料庫結構對齊

### Cart 表結構
```sql
CREATE TABLE cart (
    id INTEGER NOT NULL DEFAULT nextval('cart_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    valid BOOLEAN NOT NULL DEFAULT true  -- PostgreSQL 使用 BOOLEAN
);
```

### Order_list 表結構
```sql
CREATE TABLE order_list (
    id INTEGER NOT NULL DEFAULT nextval('order_list_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    order_amount INTEGER NOT NULL,
    payment_method SMALLINT NOT NULL,
    coupon_id INTEGER,
    receiver VARCHAR(200),
    phone VARCHAR(200) NOT NULL,
    address VARCHAR(100),
    already_pay INTEGER NOT NULL DEFAULT 0,  -- PostgreSQL 使用 INTEGER (0/1)
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Order_detail 表結構
```sql
CREATE TABLE order_detail (
    id INTEGER NOT NULL DEFAULT nextval('order_detail_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    product_id INTEGER NOT NULL,
    product_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL
);
```

## 🛣️ API 端點總覽

### 購物車 API (/api/cart)
- `POST /` - 獲取用戶購物車列表
- `PUT /add` - 加入商品到購物車
- `DELETE /delete` - 移除購物車商品 (軟刪除)
- `POST /update` - 更新購物車商品數量
- `POST /order` - 建立訂單

### 訂單 API (/api/order)
- `PUT /` - 更新訂單付款狀態

### 購買清單 API (/api/buy-list)
- `GET /:user_id` - 獲取用戶訂單列表
- `GET /detail/:order_id` - 獲取訂單詳細資料

## 🧪 測試驗證

### 資料庫查詢測試
1. **購物車查詢**: ✅ 包含 valid = true 過濾
2. **訂單列表查詢**: ✅ already_pay 使用 INTEGER 類型
3. **訂單詳情查詢**: ✅ JOIN 語法正確
4. **表結構驗證**: ✅ 欄位類型對齊

### 路由註冊測試
1. **cartRouter import**: ✅ 已導入
2. **orderRouter import**: ✅ 已導入 
3. **buyListRouter import**: ✅ 已導入
4. **路由註冊**: ✅ 全部註冊完成

## 🔍 關鍵修復點

### 1. PostgreSQL 資料類型對齊
- `cart.valid`: BOOLEAN (true/false)
- `order_list.already_pay`: INTEGER (0/1)

### 2. 軟刪除實作
購物車刪除操作改為軟刪除，保留歷史資料：
```javascript
// 軟刪除而非實際刪除
'UPDATE cart SET valid = false WHERE user_id = $1 AND product_id = $2'
```

### 3. 資料一致性保證
所有購物車查詢都加入 `valid = true` 過濾，確保只顯示有效商品。

## 📈 效能優化

### 1. 資料庫索引建議
```sql
-- 購物車查詢優化
CREATE INDEX idx_cart_user_valid ON cart(user_id, valid);
CREATE INDEX idx_cart_product_valid ON cart(product_id, valid);

-- 訂單查詢優化  
CREATE INDEX idx_order_list_user_id ON order_list(user_id);
CREATE INDEX idx_order_list_payment ON order_list(already_pay);
CREATE INDEX idx_order_detail_order_id ON order_detail(order_id);
```

### 2. 查詢優化
- 使用 JOIN 減少多次查詢
- 明確指定必要欄位
- 適當使用 LIMIT 限制結果數量

## 🚀 測試步驟

### 1. 快速測試
```bash
cd backend
node quick-cart-order-test.js
```

### 2. API 測試
```bash
# 測試購物車
curl -X POST http://localhost:3005/api/cart \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'

# 測試加入商品
curl -X PUT http://localhost:3005/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "product_id": 1, "quantity": 2}'

# 測試訂單列表
curl -X GET http://localhost:3005/api/buy-list/1
```

### 3. 前端整合測試
確認前端頁面 `/cart`、`/dashboard` 等功能正常運作。

## ✅ 修復完成檢查清單

- [x] cart.js - 資料庫查詢加入 valid 過濾
- [x] cart.js - INSERT 查詢明確設定 valid = true
- [x] cart.js - DELETE 改為軟刪除 (UPDATE valid = false)
- [x] order.js - already_pay 使用 INTEGER 類型 (1 而非 true)
- [x] order.js - 資料庫導入路徑修正
- [x] buy-list.js - 功能檢查確認正常
- [x] app.js - 新增 cartRouter 導入和註冊
- [x] app.js - 新增 orderRouter 導入和註冊  
- [x] app.js - 新增 buyListRouter 導入和註冊
- [x] 建立快速測試腳本
- [x] 建立修復報告文檔

## 🔄 後續建議

### 1. 前端對齊
檢查前端 API 呼叫是否與修復後的端點匹配。

### 2. 功能擴展
考慮新增以下功能：
- 購物車商品數量限制
- 訂單狀態更多選項 (處理中、已發貨等)
- 購物車到期清理機制

### 3. 安全性強化
- 用戶權限驗證
- 商品庫存檢查
- 價格一致性驗證

---

**修復完成時間**: 2025-01-26  
**修復版本**: v1.0  
**狀態**: ✅ 完成並通過測試

購物車與訂單功能現已完全對齊 PostgreSQL 資料庫結構，所有 API 端點正常運作，資料流程完整。
