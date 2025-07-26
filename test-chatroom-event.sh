#!/usr/bin/env bash

# ====================================================================
# CHATROOM & EVENT 功能整合測試腳本
# ====================================================================
# 此腳本用於測試 chatroom、event 和 group-request 功能的完整流程
# 確保 PostgreSQL 轉換和修復工作正確執行

set -e # 出現錯誤時停止執行

# 配置
BASE_URL="http://localhost:3005/api"
TOKEN="" # 請填入有效的 JWT token

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 輔助函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_token() {
    if [[ -z "$TOKEN" ]]; then
        log_error "請在腳本中設置有效的 JWT TOKEN"
        exit 1
    fi
}

# API 測試函數
test_api() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="${3:-}"
    local description="$4"
    
    log_info "測試: $description"
    echo "  端點: $method $endpoint"
    
    local curl_cmd="curl -s -w '%{http_code}' -o response.tmp"
    curl_cmd="$curl_cmd -X $method"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    curl_cmd="$curl_cmd -H 'Authorization: Bearer $TOKEN'"
    
    if [[ -n "$data" ]]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$BASE_URL$endpoint'"
    
    local status_code=$(eval $curl_cmd)
    
    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
        log_success "  狀態碼: $status_code"
        if [[ -s response.tmp ]]; then
            echo "  回應: $(cat response.tmp | jq -r '.message // .data // .' 2>/dev/null || cat response.tmp)"
        fi
    else
        log_error "  狀態碼: $status_code"
        if [[ -s response.tmp ]]; then
            echo "  錯誤: $(cat response.tmp)"
        fi
    fi
    
    rm -f response.tmp
    echo ""
}

# ====================================================================
# 主要測試流程
# ====================================================================

main() {
    log_info "開始 CHATROOM & EVENT 功能整合測試"
    echo ""
    
    # 檢查 token
    check_token
    
    # 1. Event 功能測試
    log_info "=== EVENT 功能測試 ==="
    
    test_api "/events" "GET" "" "獲取活動列表"
    test_api "/events/filters/types" "GET" "" "獲取活動類型"
    test_api "/events/filters/platforms" "GET" "" "獲取平台列表"
    test_api "/events/1" "GET" "" "獲取單一活動詳情 (ID=1)"
    test_api "/events/user/registered" "GET" "" "獲取用戶已報名活動"
    
    # 2. Chat 功能測試
    log_info "=== CHAT 功能測試 ==="
    
    test_api "/chat/users" "GET" "" "獲取聊天用戶列表"
    test_api "/chat/rooms" "GET" "" "獲取聊天室列表"
    test_api "/chat/rooms/1/messages" "GET" "" "獲取聊天室訊息 (ID=1)"
    
    # 3. Group Request 功能測試
    log_info "=== GROUP REQUEST 功能測試 ==="
    
    test_api "/group-requests/1" "GET" "" "獲取群組申請列表 (GroupID=1)"
    
    # 4. 資料庫連接測試
    log_info "=== 資料庫連接測試 ==="
    
    log_info "檢查關鍵 API 端點的回應時間..."
    time test_api "/events" "GET" "" "活動列表效能測試"
    time test_api "/chat/users" "GET" "" "聊天用戶列表效能測試"
    
    log_success "整合測試完成！"
    log_info "如有錯誤，請檢查："
    echo "  1. PostgreSQL 資料庫是否正常運行"
    echo "  2. 後端服務是否啟動 (port 3005)"
    echo "  3. JWT Token 是否有效"
    echo "  4. 資料表結構是否正確匹配"
}

# 使用說明
usage() {
    echo "使用方式:"
    echo "  ./test-chatroom-event.sh"
    echo ""
    echo "注意:"
    echo "  1. 請先在腳本中設置有效的 JWT TOKEN"
    echo "  2. 確保後端服務運行在 localhost:3005"
    echo "  3. 確保 PostgreSQL 資料庫正常運行"
}

# 檢查依賴
check_dependencies() {
    if ! command -v curl &> /dev/null; then
        log_error "curl 未安裝，請先安裝 curl"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq 未安裝，JSON 回應將以原始格式顯示"
    fi
}

# ====================================================================
# 腳本入口
# ====================================================================

case "${1:-}" in
    -h|--help)
        usage
        exit 0
        ;;
    *)
        check_dependencies
        main
        ;;
esac
