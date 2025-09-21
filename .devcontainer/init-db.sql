-- =============================================================================
-- Prompt Craft Database Initialization for GitHub Codespaces
-- =============================================================================
-- This script initializes the PostgreSQL database for development

-- Create the main database (already created via POSTGRES_DB)
-- CREATE DATABASE IF NOT EXISTS promptcraft;

-- Connect to the promptcraft database
\c promptcraft;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create a development user (optional, since we're using postgres user in dev)
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'promptcraft_dev') THEN
--         CREATE ROLE promptcraft_dev WITH LOGIN PASSWORD 'dev_password';
--         GRANT ALL PRIVILEGES ON DATABASE promptcraft TO promptcraft_dev;
--     END IF;
-- END $$;

-- Set timezone
SET timezone = 'UTC';

-- Display connection info
SELECT 
    'Database initialized successfully!' as status,
    version() as postgres_version,
    current_database() as database_name,
    current_user as connected_user,
    now() as initialized_at;