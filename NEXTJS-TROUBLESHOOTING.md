# Next.js 開發環境故障排除指南

## 目前問題
1. `_devMiddlewareManifest.json` 404 錯誤
2. `matchers.some is not a function` JavaScript 錯誤

## 解決步驟

### 步驟 1: 完全重置開發環境

```powershell
# 1. 停止所有 Node.js 進程
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. 清除所有快取
cd frontend
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# 3. 重新安裝
npm install

# 4. 啟動開發伺服器
npm run dev
```

### 步驟 2: 如果問題持續，使用簡化配置

```powershell
# 備份現有配置
Copy-Item next.config.js next.config.backup.js

# 使用簡化配置
Copy-Item next.config.simple.js next.config.js

# 重新啟動
npm run dev
```

### 步驟 3: 檢查 Node.js 版本

```powershell
node --version
npm --version
```

**建議版本:**
- Node.js: >= 18.17.0
- npm: >= 9.0.0

### 步驟 4: 檢查埠號衝突

```powershell
# 檢查 3000 埠是否被佔用
netstat -ano | findstr :3000

# 如果被佔用，終止進程
taskkill /PID <PID> /F
```

### 步驟 5: 手動清除快取

```powershell
# 清除 npm 快取
npm cache clean --force

# 清除 Windows 暫存檔
Remove-Item -Recurse -Force $env:TEMP\npm-* -ErrorAction SilentlyContinue
```

## 常見解決方案

### 解決方案 1: 更新 package.json

如果問題是依賴版本衝突，可以更新關鍵依賴：

```json
{
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

### 解決方案 2: 檢查防火牆/防毒軟體

某些防火牆或防毒軟體可能阻擋 localhost 連接。

### 解決方案 3: 使用不同埠號

```powershell
# 使用 3001 埠啟動
npm run dev -- -p 3001
```

## 診斷命令

```powershell
# 檢查 Next.js 版本
npm list next

# 檢查 React 版本
npm list react react-dom

# 檢查埠號使用情況
netstat -ano | findstr :3000

# 檢查網路連接
ping localhost
```

## 最後手段

如果所有方法都失敗：

1. **完全重新安裝 Node.js**
2. **刪除整個 frontend 資料夾，重新 git clone**
3. **使用 yarn 代替 npm**

```powershell
# 安裝 yarn
npm install -g yarn

# 使用 yarn
yarn install
yarn dev
```

## 成功指標

當問題解決時，您應該看到：

```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
info  - Loaded env from .env.local
event - compiled client and server successfully
```

並且瀏覽器控制台中不應再出現：
- `_devMiddlewareManifest.json` 錯誤
- `matchers.some is not a function` 錯誤
