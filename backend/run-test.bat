@echo off
echo 🚀 開始執行 CICD 自動化測試...

REM 檢查服務是否已啟動
echo ⏳ 檢查服務狀態...
netstat -ano | findstr :3005 > nul
if %errorlevel% equ 0 (
    echo ✅ 服務已在運行，直接執行測試
    goto run_test
) else (
    echo ⚠️ 服務未啟動，嘗試啟動服務...
    goto start_server
)

:start_server
echo 🔧 啟動後端服務...
start /min cmd /c "node ./bin/www.js"
timeout /t 5 /nobreak > nul
echo ⏳ 等待服務啟動...

REM 檢查服務是否啟動成功
:check_server
netstat -ano | findstr :3005 > nul
if %errorlevel% equ 0 (
    echo ✅ 服務啟動成功
    goto run_test
) else (
    echo ⏳ 還在啟動中...
    timeout /t 2 /nobreak > nul
    goto check_server
)

:run_test
echo 📊 執行 CI/CD 自動化測試...
node cicd-pipeline.js

echo 📋 測試完成！
pause
