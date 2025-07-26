const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

async function waitForServer(url, maxRetries = 30, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await axios.get(url);
            return true;
        } catch (error) {
            console.log(`等待服務啟動... (${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
}

async function startServerAndTest() {
    console.log('🚀 啟動後端服務與自動化測試...\n');
    
    // 啟動後端服務
    const serverProcess = spawn('node', ['./bin/www.js'], {
        stdio: 'pipe',
        cwd: __dirname
    });
    
    let serverStarted = false;
    
    serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[SERVER] ${output}`);
        if (output.includes('3005') || output.includes('listening')) {
            serverStarted = true;
        }
    });
    
    serverProcess.stderr.on('data', (data) => {
        console.error(`[SERVER ERROR] ${data.toString()}`);
    });
    
    // 等待服務啟動
    console.log('⏳ 等待服務啟動...');
    const isServerReady = await waitForServer('http://localhost:3005/api/health');
    
    if (isServerReady) {
        console.log('✅ 服務已啟動，開始執行自動化測試...\n');
        
        // 執行 CI/CD 測試
        const testProcess = spawn('node', ['cicd-pipeline.js'], {
            stdio: 'inherit',
            cwd: __dirname
        });
        
        testProcess.on('close', (code) => {
            console.log(`\n📊 測試完成，退出碼: ${code}`);
            
            // 關閉服務器
            console.log('🛑 關閉後端服務...');
            serverProcess.kill('SIGTERM');
            
            setTimeout(() => {
                if (!serverProcess.killed) {
                    serverProcess.kill('SIGKILL');
                }
                process.exit(code);
            }, 2000);
        });
        
        testProcess.on('error', (error) => {
            console.error('❌ 測試執行錯誤:', error);
            serverProcess.kill('SIGTERM');
            process.exit(1);
        });
        
    } else {
        console.error('❌ 服務啟動失敗或超時');
        serverProcess.kill('SIGTERM');
        process.exit(1);
    }
    
    // 處理程序終止
    process.on('SIGINT', () => {
        console.log('\n🛑 收到中斷信號，正在關閉...');
        serverProcess.kill('SIGTERM');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 收到終止信號，正在關閉...');
        serverProcess.kill('SIGTERM');
        process.exit(0);
    });
}

// 啟動
startServerAndTest().catch(error => {
    console.error('❌ 啟動失敗:', error);
    process.exit(1);
});
