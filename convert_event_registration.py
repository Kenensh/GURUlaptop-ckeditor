#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MySQL to PostgreSQL Event Registration Data Converter
Converts event_registration.sql MySQL data to PostgreSQL format
"""

import re
import json

def convert_mysql_to_postgresql():
    mysql_file = r"C:\Users\ken15.小恩\OneDrive\桌面\GURUlaptop\新增ckeditor版本(編輯中 render 用)\MFEE57-laptopGuru-ckeditor\frontend\data\database\event_registration.sql"
    postgres_file = r"C:\Users\ken15.小恩\OneDrive\桌面\GURUlaptop\新增ckeditor版本(編輯中 render 用)\MFEE57-laptopGuru-ckeditor\frontend\data\database\event_registration_postgres.sql"
    
    # Read MySQL file
    with open(mysql_file, 'r', encoding='utf-8') as f:
        content = f.read()
      # Extract INSERT statements - find everything between VALUES and the first semicolon after the VALUES
    insert_start = content.find('INSERT INTO `event_registration`')
    if insert_start == -1:
        print("No INSERT statements found")
        return
    
    values_start = content.find('VALUES', insert_start)
    if values_start == -1:
        print("No VALUES section found")
        return
    
    # Find the end of the INSERT statement (first semicolon after VALUES that's not inside quotes/JSON)
    values_section_start = values_start + len('VALUES')
    
    # Extract everything from VALUES to the end of the file, then find the real end
    remaining_content = content[values_section_start:]
    
    # Parse records more carefully
    records = []
    i = 0
    while i < len(remaining_content):
        # Skip whitespace
        while i < len(remaining_content) and remaining_content[i].isspace():
            i += 1
        
        if i >= len(remaining_content):
            break
            
        # Look for opening parenthesis
        if remaining_content[i] == '(':
            record_start = i
            paren_count = 1
            i += 1
            in_string = False
            escape_next = False
            
            # Find the matching closing parenthesis
            while i < len(remaining_content) and paren_count > 0:
                char = remaining_content[i]
                
                if escape_next:
                    escape_next = False
                elif char == '\\':
                    escape_next = True
                elif char == "'" and not escape_next:
                    in_string = not in_string
                elif not in_string:
                    if char == '(':
                        paren_count += 1
                    elif char == ')':
                        paren_count -= 1
                
                i += 1
            
            if paren_count == 0:
                # Extract the record content (without outer parentheses)
                record_content = remaining_content[record_start + 1:i - 1]
                records.append(record_content.strip())
                
                # Skip comma and whitespace
                while i < len(remaining_content) and remaining_content[i] in ',\n\r\t ':
                    i += 1
            else:
                break
        else:
            # If we hit a semicolon outside of a record, we're done
            if remaining_content[i] == ';':
                break
            i += 1
    
    print(f"Found {len(records)} records to convert")
    
    # PostgreSQL header
    postgres_content = """-- PostgreSQL version of event_registration table
-- Converted from MySQL to PostgreSQL format
-- Original file: event_registration.sql

-- Create custom enum types for PostgreSQL
CREATE TYPE registration_type_enum AS ENUM ('個人', '團體');
CREATE TYPE registration_status_enum AS ENUM ('pending', 'active', 'cancelled');

-- Create event_registration table with proper PostgreSQL syntax
CREATE TABLE public.event_registration (
    registration_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    registration_type registration_type_enum NOT NULL,
    team_id INTEGER DEFAULT NULL,
    team_name VARCHAR(100) DEFAULT NULL,
    participant_info JSONB DEFAULT NULL,
    registration_status registration_status_enum NOT NULL DEFAULT 'active',
    registration_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add comments to describe table and columns
COMMENT ON TABLE public.event_registration IS 'Event registration table for managing user event sign-ups';
COMMENT ON COLUMN public.event_registration.registration_id IS 'Primary key for registrations';
COMMENT ON COLUMN public.event_registration.event_id IS 'Foreign key reference to event table';
COMMENT ON COLUMN public.event_registration.user_id IS 'User ID of the person registering';
COMMENT ON COLUMN public.event_registration.registration_type IS 'Type of registration: individual or team';
COMMENT ON COLUMN public.event_registration.team_id IS 'Team ID if registering as team';
COMMENT ON COLUMN public.event_registration.team_name IS 'Team name if registering as team';
COMMENT ON COLUMN public.event_registration.participant_info IS 'Participant information in JSON format';
COMMENT ON COLUMN public.event_registration.registration_status IS 'Status of the registration';
COMMENT ON COLUMN public.event_registration.registration_time IS 'Timestamp when registration was made';
COMMENT ON COLUMN public.event_registration.valid IS 'Flag to indicate if registration is valid';
COMMENT ON COLUMN public.event_registration.created_at IS 'Timestamp when record was created';

-- Create indexes for better query performance
CREATE INDEX idx_event_registration_event_id ON public.event_registration(event_id);
CREATE INDEX idx_event_registration_user_id ON public.event_registration(user_id);
CREATE INDEX idx_event_registration_event_status ON public.event_registration(event_id, registration_status);
CREATE INDEX idx_event_registration_created_at ON public.event_registration(created_at);

-- Insert event registration data
INSERT INTO public.event_registration (registration_id, event_id, user_id, registration_type, team_id, team_name, participant_info, registration_status, registration_time, valid, created_at) VALUES
"""
    
    # Process records
    formatted_records = []
    for i, record in enumerate(records):
        # Clean up the record
        cleaned_record = record.strip()
        if cleaned_record:
            formatted_records.append(f"    ({cleaned_record})")
    
    # Join records with commas
    postgres_content += ",\n".join(formatted_records)
    
    # Add sequence reset
    postgres_content += ";\n\n-- Reset sequence to continue from the next ID after the last inserted record\n"
    postgres_content += "ALTER SEQUENCE event_registration_registration_id_seq RESTART WITH 4146;\n"
    
    # Write PostgreSQL file
    with open(postgres_file, 'w', encoding='utf-8') as f:
        f.write(postgres_content)
    
    print(f"Converted {len(formatted_records)} records from MySQL to PostgreSQL")
    print(f"PostgreSQL file created: {postgres_file}")

if __name__ == "__main__":
    convert_mysql_to_postgresql()
