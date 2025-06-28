-- PostgreSQL version of group_requests.sql

-- Create enum type for status (if not already created)

-- 刪除現有的 ENUM 類型（如果存在）
DROP TYPE IF EXISTS request_status CASCADE;

CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');

-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public.group_requests CASCADE;

CREATE TABLE public.group_requests (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  creator_id INTEGER NOT NULL,
  game_id VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_group_requests_group_id ON public.group_requests(group_id);
CREATE INDEX idx_group_requests_sender_id ON public.group_requests(sender_id);
CREATE INDEX idx_group_requests_creator_id ON public.group_requests(creator_id);

-- Insert data
INSERT INTO public.group_requests (id, group_id, sender_id, creator_id, game_id, description, status, created_at, updated_at) VALUES
(1, 1, 441, 440, '123', '123123', 'accepted', '2024-11-18 07:07:12', '2024-11-18 07:07:31'),
(2, 2, 441, 440, '13213', '123123', 'accepted', '2024-11-18 07:08:17', '2024-11-18 07:08:36'),
(3, 3, 441, 440, 'aaaaa', 'aaaaa', 'accepted', '2024-11-18 08:00:16', '2024-11-18 08:00:30'),
(4, 4, 441, 440, 'aaa', 'aaaaaaa', 'accepted', '2024-11-18 14:16:54', '2024-11-18 14:17:10'),
(5, 7, 441, 440, '123', '123', 'accepted', '2024-11-19 06:32:15', '2024-11-19 06:32:55'),
(6, 8, 441, 440, '123', '123', 'accepted', '2024-11-19 07:56:25', '2024-11-19 07:56:40'),
(7, 9, 441, 440, '123', '123', 'accepted', '2024-11-19 14:21:24', '2024-11-19 14:21:38'),
(8, 10, 441, 440, 'cs go', 'csgo開團', 'accepted', '2024-11-19 14:46:32', '2024-11-19 14:46:47'),
(9, 11, 441, 440, '123', '123', 'accepted', '2024-11-19 15:05:12', '2024-11-19 15:05:25'),
(11, 11, 441, 440, '123', '123', 'accepted', '2024-11-20 04:57:13', '2024-11-20 04:57:24'),
(12, 13, 441, 440, '123', '123', 'accepted', '2024-11-20 04:59:41', '2024-11-20 04:59:55'),
(13, 19, 441, 443, '啊啊啊啊', '啦啦啦啦', 'accepted', '2024-11-21 05:17:34', '2024-11-21 05:17:49'),
(14, 20, 441, 440, '123', '123', 'accepted', '2024-11-21 09:02:22', '2024-11-21 09:02:35'),
(15, 21, 440, 441, '123', '123', 'accepted', '2024-11-23 07:39:47', '2024-11-23 07:40:07'),
(16, 22, 441, 440, '123', '123', 'accepted', '2024-11-24 10:08:54', '2024-11-24 10:09:05'),
(17, 25, 450, 451, '加一加一', '哈哈哈哈', 'accepted', '2024-11-24 10:45:25', '2024-11-24 10:45:36'),
(18, 28, 452, 453, '123', '123', 'accepted', '2024-11-24 14:59:20', '2024-11-24 14:59:30'),
(19, 29, 455, 454, '登山', '一起加入吧', 'accepted', '2024-11-24 15:04:01', '2024-11-24 15:04:11');

-- Reset sequence to continue from the last id
-- 重置序列到下一個可用ID
DO $$
BEGIN
    PERFORM setval('group_requests_id_seq', COALESCE((SELECT MAX(id) FROM public.group_requests), 0) + 1, false);
END $$;
