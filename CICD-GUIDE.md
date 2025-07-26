# 🔍 全域 CI/CD 測試系統使用指南

## 🚀 快速開始

### 1. 啟動後端服務
```bash
cd backend
npm run dev
```

### 2. 執行全域測試
```bash
# 完整測試所有功能
npm run test:all

# 快速測試 (僅關鍵功能)
npm run test:quick

# CI/CD 管道測試 (包含報告)
npm run cicd:test
```

### 3. 查看測試結果
測試完成後會生成以下文件：
- `test-report.md` - 詳細測試報告
- `cicd-report-*.md` - CI/CD 報告
- `fix-guide-*.md` - 修復指南

## 📊 測試內容

### 自動測試的模組：
- ✅ **auth** - 認證功能
- ✅ **blog** - 部落格功能 (參考標準)
- ✅ **users** - 用戶管理
- ✅ **products** - 商品功能
- ✅ **cart** - 購物車
- ✅ **order** - 訂單管理
- ✅ **events** - 活動功能
- ✅ **coupon** - 優惠券
- ✅ **chat** - 聊天功能
- ✅ **ecpay** - 支付功能

### 每個模組測試：
1. **API 可達性** - 端點是否回應
2. **基本功能** - 核心操作是否正常
3. **錯誤處理** - 異常情況處理
4. **回應格式** - 數據結構正確性
5. **性能指標** - 回應時間監控

## 📋 報告解讀

### 測試狀態：
- ✅ **PASS** - 功能正常
- ❌ **FAIL** - 功能異常，需要修復

### 成功率指標：
- **95%+** - 🎉 優秀，可以部署
- **80-95%** - ⚠️ 良好，建議修復後部署  
- **80%以下** - 🚨 需要修復才能部署

### 報告內容：
1. **測試摘要** - 整體狀況
2. **模組詳情** - 各功能狀態
3. **錯誤分析** - 問題分類
4. **修復建議** - 優先級排序
5. **批量修復指南** - 具體步驟

## 🔧 常見問題修復

### 網路連接錯誤
```bash
# 檢查服務是否啟動
npm run dev

# 檢查端口是否被占用
netstat -ano | findstr :3005
```

### 資料庫連接錯誤
```bash
# 檢查資料庫狀態
npm run db-test

# 重新初始化資料庫
npm run seed
```

### 認證相關錯誤
```bash
# 檢查環境變數
echo $ACCESS_TOKEN_SECRET

# 重新生成測試用戶
npm run seed:users
```

## 🎯 使用場景

### 開發時：
```bash
# 每次修改後快速驗證
npm run test:quick

# 完整功能測試
npm run test:all
```

### 部署前：
```bash
# 完整 CI/CD 檢查
npm run cicd:test

# 如果成功率 > 80% 且關鍵模組正常，可以部署
# 如果失敗，查看 fix-guide-*.md 進行修復
```

### 雲端除錯：
```bash
# 生產環境測試
npm run cicd:prod

# 檢查健康狀態
curl https://your-domain.com/api/health
curl https://your-domain.com/api/status
```

## 📈 批量修復流程

### 步驟1：執行測試
```bash
npm run cicd:test
```

### 步驟2：查看報告
打開生成的 `fix-guide-*.md` 文件，按優先級修復

### 步驟3：批量修復
根據報告中的常見問題類型：

#### 認證問題 (401 錯誤)
- 檢查 JWT Token 配置
- 驗證中間件設定
- 確認用戶權限

#### 資料庫問題 (500 錯誤)  
- 檢查連接字串
- 驗證查詢語法
- 確認表結構

#### 參數問題 (400 錯誤)
- 檢查請求格式
- 驗證欄位名稱
- 確認資料類型

### 步驟4：重新測試
```bash
npm run test:all
```

### 步驟5：驗證修復
重複步驟 1-4 直到成功率達到 80% 以上

## 🚨 緊急修復

如果關鍵模組 (auth, users) 失敗：

```bash
# 1. 立即檢查基礎服務
npm run health:check

# 2. 重啟服務
npm run dev

# 3. 重新測試關鍵功能
npm run test:auth
npm run test:users

# 4. 如果仍然失敗，回滾到上一個穩定版本
git checkout last-stable-commit
npm run dev
npm run cicd:test
```

## 💡 最佳實踐

### 開發工作流：
1. 修改代碼
2. `npm run test:quick` 快速驗證
3. `npm run test:all` 完整測試
4. 如果成功率 > 90%，提交代碼
5. 部署前執行 `npm run cicd:test`

### 修復策略：
1. 優先修復關鍵模組 (auth, users)
2. 按失敗數量排序修復其他模組
3. 修復一個模組後立即重新測試
4. 記錄修復方法供下次參考

---

這個 CI/CD 系統可以幫您：
- 🔍 快速發現所有功能問題
- 📊 生成詳細的修復指南  
- ⚡ 批量修復相似問題
- 🚀 確保部署安全性
