# Frontend Error Fix Verification Script (PowerShell)
# 驗證前端錯誤修復效果

Write-Host "=== 前端錯誤修復驗證腳本 ===" -ForegroundColor Green
Write-Host "日期: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# 1. 檢查 CORS 設定
Write-Host "1. 檢查 CORS 設定..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend\app.js"
if (Test-Path $backendPath) {
    $corsContent = Get-Content $backendPath -Raw
    if ($corsContent -match "allowedOrigins") {
        Write-Host "✅ CORS 設定已更新 - 支援多個來源" -ForegroundColor Green
    } else {
        Write-Host "❌ CORS 設定未找到" -ForegroundColor Red
    }
} else {
    Write-Host "❌ backend/app.js 檔案未找到" -ForegroundColor Red
}

# 2. 檢查 alt 屬性修復
Write-Host ""
Write-Host "2. 檢查 alt 屬性修復..." -ForegroundColor Yellow
$frontPagePath = Join-Path $PSScriptRoot "frontend\components\frontPage\frontPage.js"
if (Test-Path $frontPagePath) {
    $frontPageContent = Get-Content $frontPagePath -Raw
    $altIssues = ([regex]::Matches($frontPageContent, "alt />")).Count
    if ($altIssues -eq 0) {
        Write-Host "✅ 所有 alt 屬性已修復" -ForegroundColor Green
    } else {
        Write-Host "❌ 仍有 $altIssues 個空 alt 屬性" -ForegroundColor Red
    }
} else {
    Write-Host "❌ FrontPage 檔案未找到" -ForegroundColor Red
}

# 3. 檢查語法完整性
Write-Host ""
Write-Host "3. 檢查語法完整性..." -ForegroundColor Yellow
if (Test-Path $frontPagePath) {
    $frontPageContent = Get-Content $frontPagePath -Raw
    if ($frontPageContent -match "export default function FrontPage") {
        Write-Host "✅ FrontPage 組件結構完整" -ForegroundColor Green
    } else {
        Write-Host "❌ FrontPage 組件結構有問題" -ForegroundColor Red
    }
}

$productCardPath = Join-Path $PSScriptRoot "frontend\components\product\product-card.js"
if (Test-Path $productCardPath) {
    $productCardContent = Get-Content $productCardPath -Raw
    if ($productCardContent -match "export default function ProductCard") {
        Write-Host "✅ ProductCard 組件結構完整" -ForegroundColor Green
    } else {
        Write-Host "❌ ProductCard 組件結構有問題" -ForegroundColor Red
    }
}

# 4. 檢查具體 alt 屬性修復
Write-Host ""
Write-Host "4. 檢查具體 alt 屬性修復..." -ForegroundColor Yellow
if (Test-Path $frontPagePath) {
    $frontPageContent = Get-Content $frontPagePath -Raw
    $arrowCount = ([regex]::Matches($frontPageContent, 'alt="arrow"')).Count
    $bannerCount = ([regex]::Matches($frontPageContent, 'alt="product banner"')).Count
    
    Write-Host "   箭頭圖片修復: $arrowCount 個" -ForegroundColor Cyan
    Write-Host "   橫幅圖片修復: $bannerCount 個" -ForegroundColor Cyan
}

# 5. 檢查 logo 圖片設定
Write-Host ""
Write-Host "5. 檢查 logo 圖片設定..." -ForegroundColor Yellow
$footerPath = Join-Path $PSScriptRoot "frontend\components\layout\default-layout\my-footer.js"
if (Test-Path $footerPath) {
    $footerContent = Get-Content $footerPath -Raw
    if ($footerContent -match "height: 'auto'") {
        Write-Host "✅ Logo 圖片已設定正確的比例" -ForegroundColor Green
    } else {
        Write-Host "❌ Logo 圖片比例設定有問題" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Footer 檔案未找到" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 驗證完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "建議下一步：" -ForegroundColor Yellow
Write-Host "1. 重新啟動後端伺服器 (npm run dev)" -ForegroundColor White
Write-Host "2. 重新啟動前端伺服器 (npm run dev)" -ForegroundColor White
Write-Host "3. 測試本地開發環境 http://localhost:3000" -ForegroundColor White
Write-Host "4. 檢查瀏覽器控制台是否還有警告" -ForegroundColor White
