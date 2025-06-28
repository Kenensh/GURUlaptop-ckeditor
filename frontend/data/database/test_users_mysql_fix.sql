-- 測試 users 表格的PostgreSQL語法修復
-- 此文件用於驗證語法問題已解決

-- 1. 刪除現有表格（如果存在）
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. 創建 users 表格（簡化版）
CREATE TABLE public.users (
  user_id SERIAL PRIMARY KEY,
  level SMALLINT DEFAULT 0,
  password VARCHAR(80) NOT NULL,
  name VARCHAR(30) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  email VARCHAR(30) NOT NULL,
  valid SMALLINT DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  gender VARCHAR(10) DEFAULT NULL,
  country VARCHAR(30) NOT NULL DEFAULT '',
  city VARCHAR(30) NOT NULL DEFAULT '',
  district VARCHAR(30) NOT NULL DEFAULT '',
  road_name VARCHAR(30) NOT NULL DEFAULT '',
  detailed_address VARCHAR(30) NOT NULL DEFAULT '',
  image_path TEXT NOT NULL DEFAULT '',
  remarks VARCHAR(150) DEFAULT NULL,
  birthdate DATE DEFAULT NULL
);

-- 3. 插入測試數據
INSERT INTO public.users (user_id, level, password, name, phone, email, valid, created_at, gender, country, city, district, road_name, detailed_address, image_path, remarks, birthdate) VALUES
(1, 0, '$2b$10$hashedpassword1', '測試用戶1', '0912345678', 'test1@example.com', 1, '2024-01-01 10:00:00', '男', '台灣', '台北市', '中正區', '重慶南路', '100號', '/images/user1.jpg', '測試用戶', '1990-01-01'),
(2, 0, '$2b$10$hashedpassword2', '測試用戶2', '0987654321', 'test2@example.com', 1, '2024-01-02 11:00:00', '女', '台灣', '台北市', '大安區', '敦化南路', '200號', '/images/user2.jpg', '測試用戶', '1995-05-15'),
(3, 1, '$2b$10$hashedpassword3', '管理員', '0912000000', 'admin@example.com', 1, '2024-01-01 09:00:00', '男', '台灣', '台北市', '信義區', '信義路', '101號', '/images/admin.jpg', '系統管理員', '1985-12-25');

-- 4. 重置序列
ALTER SEQUENCE users_user_id_seq RESTART WITH 4;

-- 5. 驗證結果
SELECT '=== Users 表格測試結果 ===' as status;
SELECT COUNT(*) as total_users FROM public.users;
SELECT user_id, name, email FROM public.users ORDER BY user_id;
SELECT '=== 測試完成，無MySQL語法錯誤 ===' as status;
