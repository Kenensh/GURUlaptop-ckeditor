# 簡化版 API 測試腳本
Write-Host "=== 簡化版 API 測試 ===" -ForegroundColor Yellow

# 測試伺服器連線
$BaseUrl = "http://localhost:3005"

try {
    Write-Host "測試伺服器連線..." -ForegroundColor White
    $response = Invoke-WebRequest -Uri $BaseUrl -TimeoutSec 3
    Write-Host "✓ 伺服器運行中" -ForegroundColor Green
    
    # 測試幾個關鍵 API
    Write-Host "`n測試關鍵 API..." -ForegroundColor White
    
    try {
        $events = Invoke-RestMethod -Uri "$BaseUrl/api/events" -Method GET
        Write-Host "✓ 活動 API 正常" -ForegroundColor Green
    } catch {
        Write-Host "✗ 活動 API 錯誤: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        $products = Invoke-RestMethod -Uri "$BaseUrl/api/products" -Method GET
        Write-Host "✓ 產品 API 正常" -ForegroundColor Green
    } catch {
        Write-Host "✗ 產品 API 錯誤: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        $coupons = Invoke-RestMethod -Uri "$BaseUrl/api/coupon" -Method GET
        Write-Host "✓ 優惠券 API 正常" -ForegroundColor Green
    } catch {
        Write-Host "✗ 優惠券 API 錯誤: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ 無法連接到伺服器" -ForegroundColor Red
    Write-Host "請確認:" -ForegroundColor Yellow
    Write-Host "1. 後端伺服器是否已啟動 (npm run dev)" -ForegroundColor Gray
    Write-Host "2. 伺服器是否在 port 3005 運行" -ForegroundColor Gray
    Write-Host "3. 資料庫連線是否正常" -ForegroundColor Gray
}

Write-Host "`n如需啟動伺服器，請執行:" -ForegroundColor Yellow
Write-Host "cd backend" -ForegroundColor Gray
Write-Host "npm run dev" -ForegroundColor Gray
