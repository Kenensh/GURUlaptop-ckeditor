# 緊急修復 Next.js 路由器錯誤

Write-Host "=== 緊急修復 Next.js 路由器錯誤 ===" -ForegroundColor Red
Write-Host "修復 matchers.some is not a function 錯誤" -ForegroundColor Yellow
Write-Host ""

$frontendPath = Join-Path $PSScriptRoot "frontend"

if (!(Test-Path $frontendPath)) {
    Write-Host "❌ frontend 目錄不存在" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath

Write-Host "1. 停止所有開發進程..." -ForegroundColor Yellow
# 強制停止所有 Node.js 進程
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "2. 清除所有 Next.js 快取..." -ForegroundColor Yellow
# 完全清除 .next 目錄
if (Test-Path ".next") {
    Write-Host "   移除 .next 目錄..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

# 清除 node_modules 中的快取
if (Test-Path "node_modules\.cache") {
    Write-Host "   清除 node_modules 快取..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
}

Write-Host "3. 重置 package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

Write-Host "4. 使用簡化的 Next.js 配置..." -ForegroundColor Yellow
# 備份原有配置
if (Test-Path "next.config.js") {
    Copy-Item "next.config.js" "next.config.backup.js" -ErrorAction SilentlyContinue
}

# 創建最小化配置
@"
/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    return config
  },
}

module.exports = nextConfig
"@ | Out-File -FilePath "next.config.minimal.js" -Encoding UTF8

Write-Host "5. 重新安裝依賴..." -ForegroundColor Yellow
try {
    npm cache clean --force
    npm install
    Write-Host "✅ 依賴重新安裝完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 依賴安裝失敗，嘗試使用 yarn..." -ForegroundColor Red
    try {
        yarn install
        Write-Host "✅ 使用 yarn 安裝成功" -ForegroundColor Green
    } catch {
        Write-Host "❌ 依賴安裝完全失敗" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "6. 嘗試使用最小化配置啟動..." -ForegroundColor Yellow
Copy-Item "next.config.minimal.js" "next.config.js" -Force

Write-Host ""
Write-Host "=== 修復步驟完成 ===" -ForegroundColor Green
Write-Host ""
Write-Host "現在請手動執行以下步驟：" -ForegroundColor Yellow
Write-Host "1. npm run dev" -ForegroundColor White
Write-Host "2. 如果仍有錯誤，按 Ctrl+C 停止，然後執行：" -ForegroundColor White
Write-Host "   Copy-Item next.config.backup.js next.config.js" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "如果問題持續，可能需要降級 Next.js 版本：" -ForegroundColor Yellow
Write-Host "npm install next@14.0.0" -ForegroundColor Gray
