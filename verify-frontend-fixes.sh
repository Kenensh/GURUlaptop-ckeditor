#!/bin/bash

# Frontend Error Fix Verification Script
# 驗證前端錯誤修復效果

echo "=== 前端錯誤修復驗證腳本 ==="
echo "日期: $(date)"
echo ""

# 1. 檢查 CORS 設定
echo "1. 檢查 CORS 設定..."
if grep -q "allowedOrigins" "../backend/app.js"; then
    echo "✅ CORS 設定已更新 - 支援多個來源"
else
    echo "❌ CORS 設定未找到"
fi

# 2. 檢查 alt 屬性修復
echo ""
echo "2. 檢查 alt 屬性修復..."
alt_issues=$(grep -c 'alt />' "../frontend/components/frontPage/frontPage.js" 2>/dev/null || echo "0")
if [ "$alt_issues" -eq 0 ]; then
    echo "✅ 所有 alt 屬性已修復"
else
    echo "❌ 仍有 $alt_issues 個空 alt 屬性"
fi

# 3. 檢查語法錯誤
echo ""
echo "3. 檢查語法完整性..."
if grep -q "export default function FrontPage" "../frontend/components/frontPage/frontPage.js"; then
    echo "✅ FrontPage 組件結構完整"
else
    echo "❌ FrontPage 組件結構有問題"
fi

if grep -q "export default function ProductCard" "../frontend/components/product/product-card.js"; then
    echo "✅ ProductCard 組件結構完整"
else
    echo "❌ ProductCard 組件結構有問題"
fi

# 4. 檢查圖片 alt 屬性具體修復
echo ""
echo "4. 檢查具體 alt 屬性修復..."
arrow_count=$(grep -c 'alt="arrow"' "../frontend/components/frontPage/frontPage.js" 2>/dev/null || echo "0")
banner_count=$(grep -c 'alt="product banner"' "../frontend/components/frontPage/frontPage.js" 2>/dev/null || echo "0")

echo "   箭頭圖片修復: $arrow_count 個"
echo "   橫幅圖片修復: $banner_count 個"

# 5. 檢查 logo 圖片設定
echo ""
echo "5. 檢查 logo 圖片設定..."
if grep -q "height: 'auto'" "../frontend/components/layout/default-layout/my-footer.js"; then
    echo "✅ Logo 圖片已設定正確的比例"
else
    echo "❌ Logo 圖片比例設定有問題"
fi

echo ""
echo "=== 驗證完成 ==="
echo ""
echo "建議下一步："
echo "1. 重新啟動後端伺服器 (npm run dev)"
echo "2. 重新啟動前端伺服器 (npm run dev)"
echo "3. 測試本地開發環境 http://localhost:3000"
echo "4. 檢查瀏覽器控制台是否還有警告"
