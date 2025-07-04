-- PostgreSQL version of group_postgres_complete.sql
-- Converted from MySQL on 2025-06-18 11:03:55
-- Table: public

-- PostgreSQL version of group table
-- Converted from MySQL to PostgreSQL format
-- Original file: group.sql

-- Create group table with proper PostgreSQL syntax
-- Note: Using DOUBLE PRECISION quotes for "group" as it's a reserved keyword in PostgreSQL
-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public."group" CASCADE;

CREATE TABLE public."group" (
    group_id SERIAL PRIMARY KEY,
    group_name VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    creator_id INTEGER NOT NULL,
    max_members INTEGER NOT NULL,
    group_img VARCHAR(255) NOT NULL,
    creat_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    group_time TIMESTAMP DEFAULT NULL,
    event_id INTEGER DEFAULT NULL,
    chat_room_id INTEGER DEFAULT NULL
);

-- Add comments to describe table and columns
COMMENT ON TABLE public."group" IS 'Gaming groups table for managing user-created groups';
COMMENT ON COLUMN public."group".group_id IS 'Primary key for groups';
COMMENT ON COLUMN public."group".group_name IS 'Name of the gaming group';
COMMENT ON COLUMN public."group".description IS 'Description of the group purpose';
COMMENT ON COLUMN public."group".creator_id IS 'User ID of the group creator';
COMMENT ON COLUMN public."group".max_members IS 'Maximum number of members allowed';
COMMENT ON COLUMN public."group".group_img IS 'Path to group image';
COMMENT ON COLUMN public."group".creat_time IS 'TIMESTAMP when group was created';
COMMENT ON COLUMN public."group".group_time IS 'Scheduled TIME for group activity';
COMMENT ON COLUMN public."group".event_id IS 'Associated event ID if any';
COMMENT ON COLUMN public."group".chat_room_id IS 'Associated chat room ID';

-- Create indexes for better query performance
CREATE INDEX idx_group_creator_id ON public."group"(creator_id);
CREATE INDEX idx_group_event_id ON public."group"(event_id);
CREATE INDEX idx_group_chat_room_id ON public."group"(chat_room_id);
CREATE INDEX idx_group_creat_time ON public."group"(creat_time);

-- Insert all group data from MySQL version
INSERT INTO public."group" (group_id, group_name, description, creator_id, max_members, group_img, creat_time, group_time, event_id, chat_room_id) VALUES
    (8, '123', '123', 440, 5, '/uploads/groups/group-1732002907145-752440747.png', '2024-11-19 15:55:07', '2024-11-20 15:54:00', 5, 8),
    (9, '123123', '123123', 440, 5, '', '2024-11-19 22:06:25', '2024-11-20 22:06:00', NULL, 9),
    (10, 'APEX - INTOVOID娛樂賽揪團', '123', 440, 5, '', '2024-11-19 22:28:12', '2024-11-22 22:28:00', 1, 10),
    (11, 'APEX - INTOVOID娛樂賽揪團', '13213', 440, 5, '/uploads/groups/group-1732027657723-373466139.png', '2024-11-19 22:47:37', '2024-11-22 22:47:00', 1, 11),
    (12, 'APEX - INTOVOID娛樂賽揪團', '123', 440, 3, '', '2024-11-19 23:26:58', '2024-11-20 23:26:00', 1, 12),
    (13, 'APEX - INTOVOID娛樂賽揪團', '123', 440, 5, '', '2024-11-20 12:59:29', '2024-11-22 12:59:00', 1, 13),
    (14, 'APEX - INTOVOID娛樂賽揪團', '123', 440, 6, '', '2024-11-20 13:02:51', '2024-11-22 13:02:00', 1, 14),
    (15, '英雄聯盟政大杯', '123123123', 440, 4, '', '2024-11-20 15:49:34', '2024-11-21 17:48:00', NULL, 15),
    (16, '123', '123', 440, 6, '', '2024-11-21 10:24:16', '2024-11-22 10:22:00', 13, 16),
    (17, '鳳凰盃個人競速賽 - 晉級決賽復活賽揪團', '13123', 440, 4, '', '2024-11-21 10:36:40', '2024-11-29 10:36:00', 21, 17),
    (18, '2023 北大盃 複賽揪團', '123', 440, 5, '', '2024-11-21 10:56:02', '2024-11-23 10:55:00', 25, 18),
    (19, '鳳凰盃個人競速賽 - 晉級決賽復活賽揪團', '12', 443, 6, '', '2024-11-21 13:15:57', '2024-11-22 16:15:00', 21, 19),
    (20, 'APEX - INTOVOID娛樂賽揪團', '123', 440, 3, '', '2024-11-21 17:00:52', '2024-11-22 17:00:00', 1, 20),
    (21, '漫威：瞬戰超能', '123', 441, 4, '/uploads/groups/group-1732347458927-919803309.jpg', '2024-11-23 15:37:38', '2024-11-25 19:37:00', 45, 21),
    (22, 'TFT', '雖然是個人比賽 但想找個伴一起參加', 441, 2, '/uploads/groups/group-1732442511315-161883718.png', '2024-11-24 18:01:51', '2024-11-30 20:00:00', 13, 22),
    (23, '劍指冠軍', '超凡以上 感恩', 449, 5, '/uploads/groups/group-1732442783131-269453367.png', '2024-11-24 18:06:23', '2024-11-30 21:00:00', 25, 23),
    (24, 'uuuuuu', '有沒有人要一起去邀請賽玩~', 450, 2, '/uploads/groups/group-1732443578559-695587024.png', '2024-11-24 18:19:38', '2024-11-24 20:00:00', 49, 24),
    (25, 'APEX娛樂賽 找人', '娛樂賽 找人開心打  不氣氛 !', 451, 6, '/uploads/groups/group-1732444934594-777154587.png', '2024-11-24 18:42:14', '2024-11-30 22:00:00', 1, 25),
    (26, '123木頭人', '找人輕鬆玩', 452, 6, '/uploads/groups/group-1732445335702-83319233.png', '2024-11-24 18:48:55', '2024-12-18 21:00:00', 9, 26),
    (27, 'TFT 比賽', '一起玩~', 452, 3, '/uploads/groups/group-1732459932610-102074121.png', '2024-11-24 22:52:12', '2024-11-30 22:51:00', 29, 27),
    (28, '鳳凰盃競速賽', '一起比賽!', 453, 3, '/uploads/groups/group-1732460136900-370525994.png', '2024-11-24 22:55:36', '2024-12-02 22:54:00', 21, 28),
    (29, 'Just Dance 舞力全開', '一起跳', 454, 3, '/uploads/groups/group-1732460473061-364484680.png', '2024-11-24 23:01:13', '2024-12-07 22:59:00', 5, 29),
    (30, '蛋仔', '跟龜龜一起參加蛋仔派對', 455, 2, '/uploads/groups/group-1732460758458-471424995.png', '2024-11-24 23:05:58', '2024-12-02 23:00:00', 37, 30),
    (31, 'APEX', '一起打 !', 457, 4, '/uploads/groups/group-1732461013550-783421269.png', '2024-11-24 23:10:13', '2024-12-03 23:09:00', 1, 31),
    (32, '跟著小活龍跳', '跳起來 !', 456, 4, '/uploads/groups/group-1732461091482-417991979.png', '2024-11-24 23:11:31', '2024-12-03 23:10:00', 5, 32);

-- Reset sequence to continue from the last id
-- 重置序列到下一個可用ID
DO $$
BEGIN
    PERFORM setval('group_group_id_seq', COALESCE((SELECT MAX(group_id) FROM public."group"), 0) + 1, false);
END $$;
