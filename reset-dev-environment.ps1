# Next.js 開發環境重置腳本

Write-Host "=== Next.js 開發環境重置腳本 ===" -ForegroundColor Green
Write-Host "日期: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

$frontendPath = Join-Path $PSScriptRoot "frontend"

if (!(Test-Path $frontendPath)) {
    Write-Host "❌ frontend 目錄不存在" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath

Write-Host "1. 停止開發伺服器..." -ForegroundColor Yellow
# 停止可能運行中的 Next.js 進程
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*Next.js*" } | Stop-Process -Force

Write-Host "2. 清除快取和依賴..." -ForegroundColor Yellow
# 刪除 node_modules
if (Test-Path "node_modules") {
    Write-Host "   刪除 node_modules..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

# 刪除 .next 快取
if (Test-Path ".next") {
    Write-Host "   刪除 .next 快取..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

# 刪除 package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "   刪除 package-lock.json..." -ForegroundColor Cyan
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

Write-Host "3. 重新安裝依賴..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✅ 依賴安裝完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 依賴安裝失敗: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "4. 檢查 Next.js 版本..." -ForegroundColor Yellow
$nextVersion = npm list next --depth=0 2>$null | Select-String "next@"
if ($nextVersion) {
    Write-Host "   Next.js 版本: $($nextVersion.Line.Trim())" -ForegroundColor Cyan
} else {
    Write-Host "   無法檢測 Next.js 版本" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 重置完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "現在可以啟動開發伺服器：" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "如果仍有問題，請檢查：" -ForegroundColor Yellow
Write-Host "1. Node.js 版本 (建議 18+)" -ForegroundColor White
Write-Host "2. 防火牆設定" -ForegroundColor White
Write-Host "3. 網路連接" -ForegroundColor White
