#!/bin/bash
# 快速修復腳本

echo "🔧 開始批量修復..."

# 1. 檢查路由文件
echo "📂 檢查路由文件..."
ls -la routes/ || echo "routes 目錄不存在"

# 2. 檢查資料庫連接
echo "🗄️ 測試資料庫連接..."
node -e "import db from './configs/db.js'; console.log('DB OK')" || echo "DB 連接失敗"

# 3. 重新啟動服務
echo "🔄 重新啟動服務..."
pkill -f "node.*www.js" || echo "沒有運行的服務"
node ./bin/www.js &

# 4. 等待啟動
echo "⏳ 等待服務啟動..."
sleep 3

# 5. 重新測試
echo "🧪 執行測試..."
node live-cicd-test.js

echo "✅ 修復流程完成"
