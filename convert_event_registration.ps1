# PowerShell script to convert MySQL INSERT statements to PostgreSQL format
# Read the MySQL file and extract INSERT data

$mysqlFile = "C:\Users\ken15.小恩\OneDrive\桌面\GURUlaptop\新增ckeditor版本(編輯中 render 用)\MFEE57-laptopGuru-ckeditor\frontend\data\database\event_registration.sql"
$postgresFile = "C:\Users\ken15.小恩\OneDrive\桌面\GURUlaptop\新增ckeditor版本(編輯中 render 用)\MFEE57-laptopGuru-ckeditor\frontend\data\database\event_registration_postgres_complete.sql"

# Read the content
$content = Get-Content $mysqlFile -Raw -Encoding UTF8

# Extract the INSERT VALUES section
$pattern = "INSERT INTO `event_registration`.*?VALUES\s*(.*?);"
if ($content -match $pattern) {
    $valuesSection = $matches[1]
    
    # Split by lines and clean up
    $lines = $valuesSection -split "`n"
    $records = @()
    
    foreach ($line in $lines) {
        $trimmed = $line.Trim()
        if ($trimmed -and $trimmed -match "^\(.*\),?$") {
            # Remove trailing comma if exists
            $record = $trimmed -replace ",$", ""
            $records += "    $record"
        }
    }
    
    # Create PostgreSQL header
    $postgresHeader = @"
-- PostgreSQL version of event_registration table
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
"@

    # Join records with commas
    $allRecords = $records -join ",`n"
    
    # Add closing semicolon and sequence reset
    $postgresFooter = @"
;

-- Reset sequence to continue from the next ID after the last inserted record
ALTER SEQUENCE event_registration_registration_id_seq RESTART WITH 4146;
"@

    # Combine all parts
    $fullContent = $postgresHeader + $allRecords + $postgresFooter
    
    # Write to file with UTF8 encoding
    $fullContent | Out-File $postgresFile -Encoding UTF8
    
    Write-Host "Converted $($records.Count) records from MySQL to PostgreSQL"
    Write-Host "PostgreSQL file created: $postgresFile"
} else {
    Write-Host "Could not find INSERT statements in MySQL file"
}
