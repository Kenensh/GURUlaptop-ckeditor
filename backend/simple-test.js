console.log('🚀 開始執行 CICD 測試...');

// 先嘗試快速檢查
const { exec } = require('child_process');
const path = require('path');

// 檢查服務是否已啟動
exec('netstat -ano | findstr :3005', (error, stdout, stderr) => {
    if (stdout.trim()) {
        console.log('✅ 服務已在運行，直接執行測試');
        runTest();
    } else {
        console.log('⚠️ 服務未啟動，嘗試啟動服務...');
        startServerAndTest();
    }
});

function runTest() {
    console.log('📊 執行 CI/CD 自動化測試...');
    
    const testProcess = exec('node cicd-pipeline.js', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ 測試執行錯誤:', error);
            return;
        }
        
        console.log('📋 測試輸出:');
        console.log(stdout);
        
        if (stderr) {
            console.error('⚠️ 警告信息:');
            console.error(stderr);
        }
        
        console.log('✅ 測試完成');
    });
}

function startServerAndTest() {
    console.log('🔧 啟動後端服務...');
    
    const serverProcess = exec('node ./bin/www.js', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ 服務啟動錯誤:', error);
            return;
        }
        
        if (stdout) {
            console.log('服務輸出:', stdout);
        }
        
        if (stderr) {
            console.error('服務錯誤:', stderr);
        }
    });
    
    // 給服務一些時間啟動，然後執行測試
    setTimeout(() => {
        console.log('⏳ 等待服務啟動完成，開始測試...');
        runTest();
    }, 3000);
    
    // 監聽服務輸出
    serverProcess.stdout.on('data', (data) => {
        console.log('[SERVER]', data.toString().trim());
        if (data.toString().includes('running on port')) {
            setTimeout(runTest, 1000);
        }
    });
    
    serverProcess.stderr.on('data', (data) => {
        console.error('[SERVER ERROR]', data.toString().trim());
    });
}

// 處理程序終止
process.on('SIGINT', () => {
    console.log('\n🛑 收到中斷信號，正在關閉...');
    process.exit(0);
});
