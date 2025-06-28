-- 完整的 chat_messages 表格匯入腳本
-- 請完整選擇並執行此腳本

-- 1. 刪除現有表格（如果存在）
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- 2. 創建表格
CREATE TABLE public.chat_messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_private SMALLINT DEFAULT 0,
  is_system SMALLINT DEFAULT 0,
  recipient_id INTEGER DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 創建索引
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);

-- 4. 插入測試數據（前5筆）
INSERT INTO public.chat_messages (id, room_id, sender_id, message, is_private, is_system, recipient_id, created_at) VALUES
(1, 1, 440, '{"type":"system","content":"使用者  已加入群組"}', 0, 1, NULL, '2024-11-18 15:07:31'),
(2, 2, 440, '{"type":"system","content":"使用者  已加入群組"}', 0, 1, NULL, '2024-11-18 15:08:36'),
(3, 2, 440, '123123123', 0, 0, NULL, '2024-11-18 15:08:45'),
(4, 2, 441, '213123213', 0, 0, NULL, '2024-11-18 15:09:00'),
(5, 3, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-18 16:00:30');

-- 5. 重置序列
ALTER SEQUENCE chat_messages_id_seq RESTART WITH 6;

-- 6. 驗證插入結果
SELECT '=== 驗證結果 ===' as status;
SELECT COUNT(*) as total_records FROM public.chat_messages;
SELECT * FROM public.chat_messages ORDER BY id LIMIT 5;
SELECT '=== 序列狀態 ===' as status;
SELECT nextval('chat_messages_id_seq') as next_id;
SELECT setval('chat_messages_id_seq', 5); -- 重置回正確值
