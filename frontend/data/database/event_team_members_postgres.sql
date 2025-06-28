-- PostgreSQL Dump
-- Converted from MySQL/MariaDB to PostgreSQL
-- Database: guru

-- Table structure for table event_team_members

-- 如果表格已存在則刪除
DROP TABLE IF EXISTS public.event_team_members CASCADE;

CREATE TABLE public.event_team_members (
    member_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    registration_id INTEGER NOT NULL,
    member_name VARCHAR(50) NOT NULL,
    member_game_id VARCHAR(50) NOT NULL,
    valid SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_event_team_members_registration_id ON public.event_team_members(registration_id);
CREATE INDEX idx_event_team_members_team_id ON public.event_team_members(team_id);

-- Add foreign key constraints (uncomment when referenced tables exist)
-- ALTER TABLE public.event_team_members 
--     ADD CONSTRAINT fk_event_team_members_registration 
--     FOREIGN KEY (registration_id) REFERENCES event_registration(registration_id) ON DELETE CASCADE;
-- ALTER TABLE public.event_team_members 
--     ADD CONSTRAINT fk_event_team_members_team 
--     FOREIGN KEY (team_id) REFERENCES event_teams(team_id) ON DELETE CASCADE;
