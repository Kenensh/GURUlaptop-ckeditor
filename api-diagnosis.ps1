# API 診斷腳本 - PowerShell 版本
# 檢查所有重要 API 端點

Write-Host "=== API 診斷腳本 ===" -ForegroundColor Yellow
Write-Host "開始檢查所有重要 API 端點..." -ForegroundColor White

# 設定伺服器位址
$BaseUrl = "http://localhost:3005"

# 檢查函數
function Check-Api {
    param(
        [string]$Endpoint,
        [string]$Method,
        [string]$Data = "",
        [string]$Description
    )
    
    Write-Host "`n檢查: $Description" -ForegroundColor Yellow
    Write-Host "端點: $Method $Endpoint" -ForegroundColor White
    
    try {
        $Uri = "$BaseUrl$Endpoint"
        $Headers = @{ "Content-Type" = "application/json" }
        
        switch ($Method) {
            "GET" {
                $Response = Invoke-RestMethod -Uri $Uri -Method GET -Headers $Headers -ErrorAction Stop
            }
            "POST" {
                $Response = Invoke-RestMethod -Uri $Uri -Method POST -Headers $Headers -Body $Data -ErrorAction Stop
            }
            "PUT" {
                $Response = Invoke-RestMethod -Uri $Uri -Method PUT -Headers $Headers -Body $Data -ErrorAction Stop
            }
            "DELETE" {
                $Response = Invoke-RestMethod -Uri $Uri -Method DELETE -Headers $Headers -Body $Data -ErrorAction Stop
            }
        }
        
        Write-Host "✓ 成功" -ForegroundColor Green
        
        # 顯示回應內容（簡化版）
        $ResponseJson = $Response | ConvertTo-Json -Depth 2 -Compress
        if ($ResponseJson.Length -lt 200) {
            Write-Host "回應: $ResponseJson" -ForegroundColor Gray
        } else {
            Write-Host "回應: $($ResponseJson.Substring(0, 100))..." -ForegroundColor Gray
        }
        
    } catch {
        $StatusCode = $_.Exception.Response.StatusCode.Value__
        if ($StatusCode -ge 400 -and $StatusCode -lt 500) {
            Write-Host "⚠ 客戶端錯誤 (HTTP $StatusCode)" -ForegroundColor DarkYellow
        } elseif ($StatusCode -ge 500) {
            Write-Host "✗ 伺服器錯誤 (HTTP $StatusCode)" -ForegroundColor Red
        } else {
            Write-Host "✗ 無法連接: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 檢查伺服器是否運行
Write-Host "`n=== 伺服器連線檢查 ===" -ForegroundColor Yellow
try {
    $Response = Invoke-WebRequest -Uri $BaseUrl -Method GET -TimeoutSec 5
    Write-Host "✓ 伺服器運行中" -ForegroundColor Green
} catch {
    Write-Host "✗ 伺服器未運行，請先啟動伺服器" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 用戶相關 API ===" -ForegroundColor Yellow
Check-Api -Endpoint "/api/users/1" -Method "GET" -Description "取得用戶資訊"

Write-Host "`n=== 產品相關 API ===" -ForegroundColor Yellow
Check-Api -Endpoint "/api/products" -Method "GET" -Description "取得產品列表"
Check-Api -Endpoint "/api/products/1" -Method "GET" -Description "取得單一產品詳情"

Write-Host "`n=== 活動相關 API ===" -ForegroundColor Yellow
Check-Api -Endpoint "/api/events" -Method "GET" -Description "取得活動列表"
Check-Api -Endpoint "/api/events/filters/types" -Method "GET" -Description "取得活動類型"
Check-Api -Endpoint "/api/events/filters/platforms" -Method "GET" -Description "取得遊戲平台"

Write-Host "`n=== 購物車相關 API ===" -ForegroundColor Yellow
Check-Api -Endpoint "/api/cart" -Method "POST" -Data '{"user_id": 1}' -Description "取得購物車內容"

Write-Host "`n=== 優惠券相關 API ===" -ForegroundColor Yellow
Check-Api -Endpoint "/api/coupon" -Method "GET" -Description "取得優惠券列表"
Check-Api -Endpoint "/api/coupon/1" -Method "GET" -Description "取得單一優惠券"

Write-Host "`n=== 聊天室相關 API ===" -ForegroundColor Yellow
Check-Api -Endpoint "/api/chat/rooms" -Method "GET" -Description "取得聊天室列表"

Write-Host "`n=== 群組相關 API ===" -ForegroundColor Yellow
Check-Api -Endpoint "/api/group" -Method "GET" -Description "取得群組列表"

Write-Host "`n=== 資料庫連線檢查 ===" -ForegroundColor Yellow
Check-Api -Endpoint "/api/events" -Method "GET" -Description "資料庫連線測試（活動）"

Write-Host "`n=== 診斷完成 ===" -ForegroundColor Yellow
Write-Host "如有錯誤，請檢查：" -ForegroundColor White
Write-Host "1. 伺服器是否正常運行" -ForegroundColor Gray
Write-Host "2. 資料庫連線是否正常" -ForegroundColor Gray
Write-Host "3. 相關路由是否正確設定" -ForegroundColor Gray
Write-Host "4. PostgreSQL 語法是否正確" -ForegroundColor Gray
