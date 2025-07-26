/**
 * Products 功能診斷工具
 * 檢查 Products 路由、API 對齊、資料庫連接與功能完整性
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  BASE_URL: 'http://localhost:3005',
  TIMEOUT: 10000,
  OUTPUT_DIR: __dirname,
  REPORT_FORMAT: 'both' // 'json', 'markdown', 'both'
};

// 測試結果儲存
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  categories: {
    routes: [],
    database: [],
    frontend_alignment: [],
    performance: []
  },
  issues: [],
  recommendations: []
};

// 日誌工具
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  test: (msg) => console.log(`🧪 ${msg}`)
};

// 新增測試結果
function addTestResult(category, test) {
  testResults.categories[category].push(test);
  testResults.summary.total++;
  
  if (test.status === 'PASS') {
    testResults.summary.passed++;
  } else if (test.status === 'FAIL') {
    testResults.summary.failed++;
    testResults.issues.push({
      category,
      test: test.name,
      error: test.error,
      priority: test.priority || 'MEDIUM'
    });
  } else if (test.status === 'WARNING') {
    testResults.summary.warnings++;
  }
}

// 新增建議
function addRecommendation(text, priority = 'MEDIUM') {
  testResults.recommendations.push({
    text,
    priority,
    timestamp: new Date().toISOString()
  });
}

// HTTP 請求工具
async function makeRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${CONFIG.BASE_URL}${endpoint}`,
      timeout: CONFIG.TIMEOUT,
      validateStatus: () => true // 接受所有狀態碼
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers,
      responseTime: response.config.timeout
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// 測試 Products 路由端點
async function testProductsRoutes() {
  log.test('開始測試 Products 路由...');
  
  const routes = [
    {
      name: '產品列表 - 基本查詢',
      endpoint: '/api/products/list',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '產品列表 - 分頁查詢',
      endpoint: '/api/products/list?page=1',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '產品列表 - 篩選查詢',
      endpoint: '/api/products/list?category=product_brand&category_value=ASUS',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '產品列表 - 搜尋查詢',
      endpoint: '/api/products/list?search=laptop',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '產品列表 - 價格範圍',
      endpoint: '/api/products/list?price=10000-50000',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '單一產品詳情 - 存在ID',
      endpoint: '/api/products/1',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '單一產品詳情 - 不存在ID',
      endpoint: '/api/products/99999',
      method: 'GET',
      expectedStatus: 200 // 應該回傳錯誤訊息但狀態碼是200
    },
    {
      name: '產品卡片資料',
      endpoint: '/api/products/card/1',
      method: 'GET',
      expectedStatus: 200
    },
    {
      name: '相關產品',
      endpoint: '/api/products/related/1',
      method: 'GET',
      expectedStatus: 200
    }
  ];
  
  for (const route of routes) {
    const result = await makeRequest(route.endpoint, route.method);
    
    const test = {
      name: route.name,
      endpoint: route.endpoint,
      method: route.method,
      expectedStatus: route.expectedStatus,
      actualStatus: result.status,
      responseTime: result.responseTime,
      timestamp: new Date().toISOString()
    };
    
    if (result.success) {
      if (result.status === route.expectedStatus) {
        test.status = 'PASS';
        test.message = '端點正常運作';
        
        // 檢查回應格式
        if (result.data) {
          test.responseFormat = {
            hasStatus: 'status' in result.data,
            hasData: 'data' in result.data,
            statusValue: result.data.status
          };
          
          if (result.data.status === 'error') {
            test.status = 'WARNING';
            test.message = `端點回傳錯誤: ${result.data.message}`;
          }
        }
        
        log.success(`${route.name}: ${test.message}`);
      } else {
        test.status = 'FAIL';
        test.error = `狀態碼不符，期望 ${route.expectedStatus}，實際 ${result.status}`;
        test.priority = 'HIGH';
        log.error(`${route.name}: ${test.error}`);
      }
    } else {
      test.status = 'FAIL';
      test.error = result.error;
      test.priority = 'CRITICAL';
      log.error(`${route.name}: 請求失敗 - ${result.error}`);
    }
    
    addTestResult('routes', test);
  }
}

// 測試前後端 API 對齊
async function testFrontendAlignment() {
  log.test('檢查前後端 API 對齊情況...');
  
  // 前端 API 配置檢查
  const frontendApiPath = path.join(__dirname, '../frontend/services/api/product.js');
  
  const alignmentTest = {
    name: '前後端 API 路徑對齊檢查',
    timestamp: new Date().toISOString()
  };
  
  try {
    if (fs.existsSync(frontendApiPath)) {
      const frontendContent = fs.readFileSync(frontendApiPath, 'utf8');
      
      // 檢查 API 路徑模式
      const apiPathPatterns = [
        { pattern: '/api/products', description: '產品列表路徑' },
        { pattern: '/api/products/${id}', description: '單一產品路徑' },
        { pattern: '/api/products/related/${id}', description: '相關產品路徑' }
      ];
      
      alignmentTest.patterns = [];
      let allPatternsFound = true;
      
      for (const pattern of apiPathPatterns) {
        const found = frontendContent.includes(pattern.pattern.replace('${id}', '${'));
        alignmentTest.patterns.push({
          pattern: pattern.pattern,
          description: pattern.description,
          found
        });
        
        if (!found) {
          allPatternsFound = false;
        }
      }
      
      if (allPatternsFound) {
        alignmentTest.status = 'PASS';
        alignmentTest.message = '前後端 API 路徑對齊正確';
        log.success('前後端 API 路徑對齊檢查通過');
      } else {
        alignmentTest.status = 'WARNING';
        alignmentTest.message = '部分 API 路徑可能不對齊';
        alignmentTest.priority = 'MEDIUM';
        log.warning('前後端 API 路徑對齊檢查發現問題');
      }
      
      // 檢查前端是否有使用正確的查詢參數
      const queryParamChecks = [
        { param: 'page', description: '分頁參數' },
        { param: 'perpage', description: '每頁數量參數' }
      ];
      
      alignmentTest.queryParams = [];
      for (const check of queryParamChecks) {
        const found = frontendContent.includes(check.param);
        alignmentTest.queryParams.push({
          param: check.param,
          description: check.description,
          found
        });
      }
      
    } else {
      alignmentTest.status = 'FAIL';
      alignmentTest.error = '找不到前端 product.js API 檔案';
      alignmentTest.priority = 'HIGH';
      log.error('找不到前端 product.js API 檔案');
    }
  } catch (error) {
    alignmentTest.status = 'FAIL';
    alignmentTest.error = `讀取前端檔案失敗: ${error.message}`;
    alignmentTest.priority = 'HIGH';
    log.error(`讀取前端檔案失敗: ${error.message}`);
  }
  
  addTestResult('frontend_alignment', alignmentTest);
}

// 測試效能與資料品質
async function testPerformanceAndQuality() {
  log.test('檢查效能與資料品質...');
  
  // 測試回應時間
  const performanceTests = [
    {
      name: '產品列表回應時間',
      endpoint: '/api/products/list?page=1',
      maxResponseTime: 2000
    },
    {
      name: '單一產品回應時間',
      endpoint: '/api/products/1',
      maxResponseTime: 1000
    }
  ];
  
  for (const perfTest of performanceTests) {
    const startTime = Date.now();
    const result = await makeRequest(perfTest.endpoint);
    const responseTime = Date.now() - startTime;
    
    const test = {
      name: perfTest.name,
      endpoint: perfTest.endpoint,
      responseTime,
      maxResponseTime: perfTest.maxResponseTime,
      timestamp: new Date().toISOString()
    };
    
    if (result.success && responseTime <= perfTest.maxResponseTime) {
      test.status = 'PASS';
      test.message = `回應時間 ${responseTime}ms (< ${perfTest.maxResponseTime}ms)`;
      log.success(`${perfTest.name}: ${test.message}`);
    } else if (result.success) {
      test.status = 'WARNING';
      test.message = `回應時間過長: ${responseTime}ms (> ${perfTest.maxResponseTime}ms)`;
      test.priority = 'MEDIUM';
      log.warning(`${perfTest.name}: ${test.message}`);
    } else {
      test.status = 'FAIL';
      test.error = result.error;
      test.priority = 'HIGH';
      log.error(`${perfTest.name}: ${test.error}`);
    }
    
    addTestResult('performance', test);
  }
}

// 生成修復建議
function generateRecommendations() {
  log.info('生成修復建議...');
  
  const criticalIssues = testResults.issues.filter(issue => issue.priority === 'CRITICAL');
  const highIssues = testResults.issues.filter(issue => issue.priority === 'HIGH');
  const mediumIssues = testResults.issues.filter(issue => issue.priority === 'MEDIUM');
  
  if (criticalIssues.length > 0) {
    addRecommendation(
      '🚨 發現嚴重問題，請優先修復：確保後端服務正在運行且資料庫連接正常',
      'CRITICAL'
    );
  }
  
  if (highIssues.length > 0) {
    addRecommendation(
      '⚠️ 發現高優先級問題：檢查 API 路由配置和權限設定',
      'HIGH'
    );
  }
  
  if (testResults.summary.warnings > 0) {
    addRecommendation(
      '📝 建議改善項目：優化錯誤處理和回應格式標準化',
      'MEDIUM'
    );
  }
  
  // 通用建議
  addRecommendation(
    '📊 建議定期執行此診斷工具來監控 Products 功能健康狀況',
    'LOW'
  );
  
  addRecommendation(
    '🔄 建議實施 API 版本控制以確保前後端長期相容性',
    'LOW'
  );
}

// 生成 Markdown 報告
function generateMarkdownReport() {
  const report = `# Products 功能診斷報告

## 📊 測試摘要
- **執行時間**: ${testResults.timestamp}
- **總測試數**: ${testResults.summary.total}
- **通過**: ${testResults.summary.passed} ✅
- **失敗**: ${testResults.summary.failed} ❌  
- **警告**: ${testResults.summary.warnings} ⚠️
- **成功率**: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%

## 🛣️ 路由測試結果

${testResults.categories.routes.map(test => `
### ${test.name}
- **端點**: \`${test.endpoint}\`
- **方法**: ${test.method}
- **狀態**: ${test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌'} ${test.status}
- **回應時間**: ${test.responseTime || 'N/A'}ms
${test.message ? `- **訊息**: ${test.message}` : ''}
${test.error ? `- **錯誤**: ${test.error}` : ''}
`).join('\n')}

## 🔄 前後端對齊檢查

${testResults.categories.frontend_alignment.map(test => `
### ${test.name}
- **狀態**: ${test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌'} ${test.status}
${test.message ? `- **訊息**: ${test.message}` : ''}
${test.error ? `- **錯誤**: ${test.error}` : ''}

${test.patterns ? test.patterns.map(p => `- **${p.description}**: ${p.found ? '✅' : '❌'} \`${p.pattern}\``).join('\n') : ''}
`).join('\n')}

## ⚡ 效能測試結果

${testResults.categories.performance.map(test => `
### ${test.name}
- **端點**: \`${test.endpoint}\`
- **狀態**: ${test.status === 'PASS' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌'} ${test.status}
- **回應時間**: ${test.responseTime}ms / ${test.maxResponseTime}ms
${test.message ? `- **訊息**: ${test.message}` : ''}
`).join('\n')}

## 🚨 發現的問題

${testResults.issues.length > 0 ? testResults.issues.map((issue, index) => `
### ${index + 1}. ${issue.test}
- **類別**: ${issue.category}
- **優先級**: ${issue.priority}
- **錯誤**: ${issue.error}
`).join('\n') : '✅ 未發現嚴重問題'}

## 💡 修復建議

${testResults.recommendations.map((rec, index) => `
${index + 1}. **[${rec.priority}]** ${rec.text}
`).join('\n')}

## 🔧 快速修復指令

\`\`\`bash
# 檢查後端服務狀態
curl -X GET http://localhost:3005/api/products/list

# 重啟後端服務 (如果需要)
cd backend && npm run dev

# 檢查資料庫連接
node -e "import('./configs/db.js').then(db => console.log('DB Connected'))"
\`\`\`

---
*報告生成時間: ${new Date().toISOString()}*
`;

  return report;
}

// 儲存報告
function saveReports() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (CONFIG.REPORT_FORMAT === 'json' || CONFIG.REPORT_FORMAT === 'both') {
    const jsonPath = path.join(CONFIG.OUTPUT_DIR, `products-diagnosis-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
    log.success(`JSON 報告已儲存: ${jsonPath}`);
  }
  
  if (CONFIG.REPORT_FORMAT === 'markdown' || CONFIG.REPORT_FORMAT === 'both') {
    const markdownPath = path.join(CONFIG.OUTPUT_DIR, 'products-diagnosis-report.md');
    fs.writeFileSync(markdownPath, generateMarkdownReport());
    log.success(`Markdown 報告已儲存: ${markdownPath}`);
  }
}

// 主要執行函數
async function runDiagnosis() {
  console.log('🚀 開始執行 Products 功能診斷...\n');
  
  try {
    // 執行所有測試
    await testProductsRoutes();
    await testFrontendAlignment();
    await testPerformanceAndQuality();
    
    // 生成建議
    generateRecommendations();
    
    // 顯示摘要
    console.log('\n📊 診斷摘要:');
    console.log(`✅ 通過: ${testResults.summary.passed}`);
    console.log(`❌ 失敗: ${testResults.summary.failed}`);
    console.log(`⚠️ 警告: ${testResults.summary.warnings}`);
    console.log(`📈 成功率: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    if (testResults.issues.length > 0) {
      console.log('\n🚨 需要注意的問題:');
      testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.priority}] ${issue.test}: ${issue.error}`);
      });
    }
    
    // 儲存報告
    saveReports();
    
    console.log('\n✨ Products 功能診斷完成！');
    
  } catch (error) {
    log.error(`診斷過程發生錯誤: ${error.message}`);
    process.exit(1);
  }
}

// 執行診斷
if (import.meta.url === `file://${process.argv[1]}`) {
  runDiagnosis();
}

export default {
  runDiagnosis,
  testResults,
  CONFIG
};
