-- PostgreSQL version of group_members.sql

-- Create enum type for status

-- 刪除現有的 ENUM 類型（如果存在）
DROP TYPE IF EXISTS group_member_status CASCADE;

CREATE TYPE group_member_status AS ENUM ('pending', 'accepted', 'rejected');

-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public.group_members CASCADE;

CREATE TABLE public.group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  join_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status group_member_status NOT NULL DEFAULT 'accepted'
);

-- Create indexes
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_member_id ON public.group_members(member_id);

-- Insert data
INSERT INTO public.group_members (id, group_id, member_id, join_time, status) VALUES
(32, 14, 440, '2024-11-20 13:02:51', 'accepted'),
(35, 15, 440, '2024-11-20 15:49:34', 'accepted'),
(36, 16, 440, '2024-11-21 10:24:16', 'accepted'),
(37, 17, 440, '2024-11-21 10:36:40', 'accepted'),
(40, 18, 440, '2024-11-21 10:56:02', 'accepted'),
(49, 21, 441, '2024-11-23 15:37:38', 'accepted'),
(50, 21, 440, '2024-11-23 15:39:47', 'accepted'),
(52, 22, 441, '2024-11-24 18:01:51', 'accepted'),
(53, 23, 449, '2024-11-24 18:06:23', 'accepted'),
(54, 24, 450, '2024-11-24 18:17:07', 'accepted'),
(55, 25, 451, '2024-11-24 18:40:31', 'accepted'),
(56, 25, 450, '2024-11-24 18:45:36', 'accepted'),
(57, 26, 452, '2024-11-24 18:47:53', 'accepted'),
(58, 27, 452, '2024-11-24 22:50:07', 'accepted'),
(59, 28, 453, '2024-11-24 22:56:27', 'accepted'),
(60, 28, 452, '2024-11-24 22:59:30', 'accepted'),
(61, 29, 454, '2024-11-24 23:00:18', 'accepted'),
(62, 29, 455, '2024-11-24 23:04:11', 'accepted'),
(63, 30, 455, '2024-11-24 23:05:22', 'accepted'),
(64, 31, 457, '2024-11-24 23:10:31', 'accepted'),
(65, 32, 456, '2024-11-24 23:10:52', 'accepted'),
(66, 8, 441, '2024-11-24 23:15:47', 'accepted'),
(67, 8, 442, '2024-11-24 23:15:47', 'accepted'),
(68, 10, 441, '2024-11-24 23:15:47', 'accepted'),
(69, 10, 442, '2024-11-24 23:15:47', 'accepted'),
(70, 13, 441, '2024-11-24 23:15:47', 'accepted'),
(71, 13, 443, '2024-11-24 23:15:47', 'accepted'),
(72, 19, 451, '2024-11-24 23:15:47', 'accepted'),
(73, 19, 450, '2024-11-24 23:15:47', 'accepted');

-- Reset sequence to continue from the last id
-- 重置序列到下一個可用ID
DO $$
BEGIN
    PERFORM setval('group_members_id_seq', COALESCE((SELECT MAX(id) FROM public.group_members), 0) + 1, false);
END $$;
