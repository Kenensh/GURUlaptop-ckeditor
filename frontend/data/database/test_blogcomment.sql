-- 測試 blogcomment_postgres.sql 的匯入
-- 這個檔案應該可以直接在 PostgreSQL 中執行

-- 1. 先刪除現有表格（如果存在）
DROP TABLE IF EXISTS blogcomment CASCADE;

-- 2. 創建序列（如果不存在）
CREATE SEQUENCE IF NOT EXISTS blogcomment_blog_comment_id_seq;

-- 3. 創建表格
CREATE TABLE blogcomment (
    blog_comment_id INTEGER PRIMARY KEY DEFAULT nextval('blogcomment_blog_comment_id_seq'),
    blog_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    blog_content TEXT NOT NULL,
    blog_created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. 插入測試數據（只插入前3筆作為測試）
INSERT INTO blogcomment (blog_comment_id, blog_id, user_id, blog_content, blog_created_at) VALUES
(1, 1, 1, '這款筆電的性價比真的很高！', '2024-11-06 13:50:15'),
(2, 1, 1, '外觀設計很時尚，很喜歡', '2024-11-06 15:25:33'),
(3, 1, 1, '使用起來很順手，推薦！', '2024-11-06 18:40:27');

-- 5. 重置序列到正確的值
ALTER SEQUENCE blogcomment_blog_comment_id_seq RESTART WITH 4;

-- 6. 驗證插入和序列
SELECT 'blogcomment 表格創建成功' as message;
SELECT COUNT(*) as record_count FROM blogcomment;
SELECT nextval('blogcomment_blog_comment_id_seq') as next_id;
SELECT setval('blogcomment_blog_comment_id_seq', 3); -- 重置回去
