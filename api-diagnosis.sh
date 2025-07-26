#!/bin/bash

# API 診斷腳本 - 檢查所有重要 API 端點
echo "=== API 診斷腳本 ==="
echo "開始檢查所有重要 API 端點..."

# 設定伺服器位址
BASE_URL="http://localhost:3005"

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查函數
check_api() {
    local endpoint=$1
    local method=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}檢查: $description${NC}"
    echo "端點: $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ 成功 (HTTP $http_code)${NC}"
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo -e "${YELLOW}⚠ 客戶端錯誤 (HTTP $http_code)${NC}"
    elif [ "$http_code" -ge 500 ]; then
        echo -e "${RED}✗ 伺服器錯誤 (HTTP $http_code)${NC}"
    else
        echo -e "${RED}✗ 無法連接${NC}"
    fi
    
    # 顯示回應內容（如果不是太長）
    if [ ${#body} -lt 500 ]; then
        echo "回應: $body"
    else
        echo "回應: $(echo "$body" | head -c 100)..."
    fi
}

echo -e "\n${YELLOW}=== 伺服器連線檢查 ===${NC}"
if curl -s "$BASE_URL" > /dev/null; then
    echo -e "${GREEN}✓ 伺服器運行中${NC}"
else
    echo -e "${RED}✗ 伺服器未運行，請先啟動伺服器${NC}"
    exit 1
fi

echo -e "\n${YELLOW}=== 用戶相關 API ===${NC}"
check_api "/api/users/1" "GET" "" "取得用戶資訊"

echo -e "\n${YELLOW}=== 產品相關 API ===${NC}"
check_api "/api/products" "GET" "" "取得產品列表"
check_api "/api/products/1" "GET" "" "取得單一產品詳情"

echo -e "\n${YELLOW}=== 活動相關 API ===${NC}"
check_api "/api/events" "GET" "" "取得活動列表"
check_api "/api/events/filters/types" "GET" "" "取得活動類型"
check_api "/api/events/filters/platforms" "GET" "" "取得遊戲平台"

echo -e "\n${YELLOW}=== 購物車相關 API ===${NC}"
check_api "/api/cart" "POST" '{"user_id": 1}' "取得購物車內容"

echo -e "\n${YELLOW}=== 優惠券相關 API ===${NC}"
check_api "/api/coupon" "GET" "" "取得優惠券列表"
check_api "/api/coupon/1" "GET" "" "取得單一優惠券"

echo -e "\n${YELLOW}=== 聊天室相關 API ===${NC}"
check_api "/api/chat/rooms" "GET" "" "取得聊天室列表"

echo -e "\n${YELLOW}=== 群組相關 API ===${NC}"
check_api "/api/group" "GET" "" "取得群組列表"

echo -e "\n${YELLOW}=== 資料庫連線檢查 ===${NC}"
# 檢查需要資料庫的 API
check_api "/api/events" "GET" "" "資料庫連線測試（活動）"

echo -e "\n${YELLOW}=== 診斷完成 ===${NC}"
echo "如有錯誤，請檢查："
echo "1. 伺服器是否正常運行"
echo "2. 資料庫連線是否正常"
echo "3. 相關路由是否正確設定"
echo "4. PostgreSQL 語法是否正確"
