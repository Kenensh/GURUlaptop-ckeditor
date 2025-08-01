-- PostgreSQL version of chat_messages.sql

-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public.chat_messages CASCADE;

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

-- Create indexes
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);

-- Insert sample data
INSERT INTO public.chat_messages (id, room_id, sender_id, message, is_private, is_system, recipient_id, created_at) VALUES
(1, 1, 440, '{"type":"system","content":"使用者  已加入群組"}', 0, 1, NULL, '2024-11-18 15:07:31'),
(2, 2, 440, '{"type":"system","content":"使用者  已加入群組"}', 0, 1, NULL, '2024-11-18 15:08:36'),
(3, 2, 440, '123123123', 0, 0, NULL, '2024-11-18 15:08:45'),
(4, 2, 441, '213123213', 0, 0, NULL, '2024-11-18 15:09:00'),
(5, 3, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-18 16:00:30'),
(6, 3, 440, '123123123', 0, 0, NULL, '2024-11-18 16:00:38'),
(7, 3, 441, '555555555555', 0, 0, NULL, '2024-11-18 16:00:53'),
(8, 4, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-18 22:17:10'),
(9, 7, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-19 14:32:45'),
(10, 7, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-19 14:32:45'),
(11, 7, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-19 14:32:45'),
(12, 7, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-19 14:32:45'),
(13, 7, 440, '123', 0, 0, NULL, '2024-11-19 14:33:11'),
(14, 7, 441, '123', 0, 0, NULL, '2024-11-19 14:33:29'),
(15, 8, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-19 15:56:40'),
(16, 8, 441, '123', 0, 0, NULL, '2024-11-19 15:56:57'),
(17, 8, 441, '123', 0, 0, NULL, '2024-11-19 15:56:57'),
(18, 8, 440, '123', 0, 0, NULL, '2024-11-19 15:57:04'),
(19, 8, 440, '123', 0, 0, NULL, '2024-11-19 15:57:35'),
(20, 9, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-19 22:21:38'),
(21, 10, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-19 22:46:47'),
(22, 11, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-19 23:05:25'),
(23, 8, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:28:30'),
(24, 8, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:28:34'),
(25, 8, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:28:38'),
(26, 9, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:29:40'),
(27, 8, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-20 12:30:21'),
(28, 9, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-20 12:30:24'),
(29, 10, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:32:49'),
(30, 10, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:32:55'),
(31, 10, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:33:02'),
(32, 10, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:33:08'),
(33, 11, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:33:14'),
(34, 10, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:46:28'),
(35, 10, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-20 12:56:29'),
(36, 11, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-20 12:56:31'),
(37, 12, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:56:43'),
(38, 11, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-20 12:57:24'),
(39, 11, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 12:58:54'),
(40, 13, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-20 12:59:55'),
(41, 13, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-20 13:00:18'),
(42, 13, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-20 13:00:34'),
(43, 14, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-20 13:03:09'),
(44, 14, 440, '123', 0, 0, NULL, '2024-11-20 13:03:24'),
(45, 14, 440, '123123', 0, 0, NULL, '2024-11-20 13:03:34'),
(46, 17, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-21 10:40:17'),
(47, 18, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-21 10:56:49'),
(48, 11, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-21 10:57:49'),
(49, 14, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-21 10:57:55'),
(50, 17, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-21 10:58:03'),
(51, 18, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-21 10:58:09'),
(52, 19, 443, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-21 13:17:49'),
(53, 19, 443, '132', 0, 0, NULL, '2024-11-21 13:18:10'),
(54, 19, 441, '13', 0, 0, NULL, '2024-11-21 13:18:29'),
(55, 19, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-21 13:18:42'),
(56, 19, 0, '{"type":"system","content":"使用者 未知用戶 已離開群組"}', 0, 1, NULL, '2024-11-21 13:18:55'),
(57, 20, 440, '{"type":"system","content":"使用者 妙蛙種子 已加入群組"}', 0, 1, NULL, '2024-11-21 17:02:15'),
(58, 20, 440, '123', 0, 0, NULL, '2024-11-21 17:02:34'),
(59, 20, 441, '123', 0, 0, NULL, '2024-11-21 17:02:43'),
(60, 20, 0, '{"type":"system","content":"使用者 妙蛙種子 已離開群組"}', 0, 1, NULL, '2024-11-21 17:03:03'),
(61, 20, 0, '{"type":"system","content":"使用者 皮卡丘 已離開群組"}', 0, 1, NULL, '2024-11-21 17:03:19'),
(62, 21, 441, '{"type":"system","content":"使用者 皮卡丘 已加入群組"}', 0, 1, NULL, '2024-11-23 15:39:47'),
(63, 21, 440, '你好 歡迎加入~', 0, 0, NULL, '2024-11-23 15:40:35'),
(64, 21, 441, '你好呀 !', 0, 0, NULL, '2024-11-23 15:40:47'),
(65, 22, 441, '{"type":"system","content":"使用者 圖奇 已加入群組"}', 0, 1, NULL, '2024-11-24 18:09:05'),
(66, 23, 449, '{"type":"system","content":"使用者 龍點 已加入群組"}', 0, 1, NULL, '2024-11-24 18:09:50'),
(67, 24, 450, '{"type":"system","content":"使用者 圖奇 已加入群組"}', 0, 1, NULL, '2024-11-24 18:20:21'),
(68, 25, 451, '{"type":"system","content":"使用者 安比薩 已加入群組"}', 0, 1, NULL, '2024-11-24 18:43:08'),
(69, 25, 451, '{"type":"system","content":"使用者 齊勒斯 已加入群組"}', 0, 1, NULL, '2024-11-24 18:45:36'),
(70, 26, 452, '{"type":"system","content":"使用者 努努 已加入群組"}', 0, 1, NULL, '2024-11-24 18:50:35'),
(71, 27, 452, '{"type":"system","content":"使用者 努努 已加入群組"}', 0, 1, NULL, '2024-11-24 22:52:49'),
(72, 28, 453, '{"type":"system","content":"使用者 噴火龍 已加入群組"}', 0, 1, NULL, '2024-11-24 22:59:28'),
(73, 28, 453, '{"type":"system","content":"使用者 努努 已加入群組"}', 0, 1, NULL, '2024-11-24 22:59:30'),
(74, 29, 454, '{"type":"system","content":"使用者 阿拉瓜瓜 已加入群組"}', 0, 1, NULL, '2024-11-24 23:01:52'),
(75, 29, 454, '{"type":"system","content":"使用者 傑尼龜 已加入群組"}', 0, 1, NULL, '2024-11-24 23:04:11'),
(76, 30, 455, '{"type":"system","content":"使用者 噴火龍 已加入群組"}', 0, 1, NULL, '2024-11-24 23:06:30'),
(77, 31, 457, '{"type":"system","content":"使用者 小火龍 已加入群組"}', 0, 1, NULL, '2024-11-24 23:12:28'),
(78, 32, 456, '{"type":"system","content":"使用者 皮卡丘 已加入群組"}', 0, 1, NULL, '2024-11-24 23:12:31');

-- Reset sequence to continue from the last id
-- 重置序列到下一個可用ID
DO $$
BEGIN
    PERFORM setval('chat_messages_id_seq', COALESCE((SELECT MAX(id) FROM chat_messages), 0) + 1, false);
END $$;
