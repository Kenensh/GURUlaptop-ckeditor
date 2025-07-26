# ====================================================================
# CHATROOM & EVENT 功能整合測試腳本 (PowerShell 版本)
# ====================================================================
# 此腳本用於測試 chatroom、event 和 group-request 功能的完整流程
# 確保 PostgreSQL 轉換和修復工作正確執行

# 配置
$BaseUrl = "http://localhost:3005/api"
$Token = ""  # 請填入有效的 JWT token

# 顏色輸出
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-Token {
    if ([string]::IsNullOrEmpty($Token)) {
        Write-Error "請在腳本中設置有效的 JWT TOKEN"
        exit 1
    }
}

# API 測試函數
function Test-Api {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [string]$Data = "",
        [string]$Description
    )
    
    Write-Info "測試: $Description"
    Write-Host "  端點: $Method $Endpoint"
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $Token"
        }
        
        $uri = "$BaseUrl$Endpoint"
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $Data
        }
        
        Write-Success "  狀態: 成功"
        
        if ($response.message) {
            Write-Host "  訊息: $($response.message)"
        } elseif ($response.data) {
            Write-Host "  資料: 已取得 $(($response.data | Measure-Object).Count) 筆資料"
        }
        
    } catch {
        Write-Error "  狀態: 失敗"
        Write-Host "  錯誤: $($_.Exception.Message)"
    }
    
    Write-Host ""
}

# ====================================================================
# 主要測試流程
# ====================================================================

function Main {
    Write-Info "開始 CHATROOM & EVENT 功能整合測試"
    Write-Host ""
    
    # 檢查 token
    Test-Token
    
    # 1. Event 功能測試
    Write-Info "=== EVENT 功能測試 ==="
    
    Test-Api "/events" "GET" "" "獲取活動列表"
    Test-Api "/events/filters/types" "GET" "" "獲取活動類型"
    Test-Api "/events/filters/platforms" "GET" "" "獲取平台列表"
    Test-Api "/events/1" "GET" "" "獲取單一活動詳情 (ID=1)"
    Test-Api "/events/user/registered" "GET" "" "獲取用戶已報名活動"
    
    # 2. Chat 功能測試
    Write-Info "=== CHAT 功能測試 ==="
    
    Test-Api "/chat/users" "GET" "" "獲取聊天用戶列表"
    Test-Api "/chat/rooms" "GET" "" "獲取聊天室列表"
    Test-Api "/chat/rooms/1/messages" "GET" "" "獲取聊天室訊息 (ID=1)"
    
    # 3. Group Request 功能測試
    Write-Info "=== GROUP REQUEST 功能測試 ==="
    
    Test-Api "/group-requests/1" "GET" "" "獲取群組申請列表 (GroupID=1)"
    
    # 4. 資料庫連接測試
    Write-Info "=== 資料庫連接測試 ==="
    
    Write-Info "檢查關鍵 API 端點的回應時間..."
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Test-Api "/events" "GET" "" "活動列表效能測試"
    $sw.Stop()
    Write-Host "  執行時間: $($sw.ElapsedMilliseconds)ms"
    
    $sw.Restart()
    Test-Api "/chat/users" "GET" "" "聊天用戶列表效能測試"
    $sw.Stop()
    Write-Host "  執行時間: $($sw.ElapsedMilliseconds)ms"
    
    Write-Success "整合測試完成！"
    Write-Info "如有錯誤，請檢查："
    Write-Host "  1. PostgreSQL 資料庫是否正常運行"
    Write-Host "  2. 後端服務是否啟動 (port 3005)"
    Write-Host "  3. JWT Token 是否有效"
    Write-Host "  4. 資料表結構是否正確匹配"
}

# 使用說明
function Show-Usage {
    Write-Host "使用方式:"
    Write-Host "  .\test-chatroom-event.ps1"
    Write-Host ""
    Write-Host "注意:"
    Write-Host "  1. 請先在腳本中設置有效的 JWT TOKEN"
    Write-Host "  2. 確保後端服務運行在 localhost:3005"
    Write-Host "  3. 確保 PostgreSQL 資料庫正常運行"
}

# ====================================================================
# 腳本入口
# ====================================================================

param(
    [switch]$Help
)

if ($Help) {
    Show-Usage
    exit 0
}

# 執行主程序
Main
