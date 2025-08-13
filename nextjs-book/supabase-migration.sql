-- Supabase Database Migration Script
-- Multi-Tenant SaaS Prisma Schema for Interactive Python Learning Platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE industry AS ENUM ('GENERAL', 'HEALTHCARE', 'FINANCE', 'TECHNOLOGY', 'EDUCATION', 'MANUFACTURING', 'GOVERNMENT', 'NON_PROFIT');
CREATE TYPE subscription_status AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');
CREATE TYPE subscription_tier AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'INSTRUCTOR', 'LEARNER');
CREATE TYPE difficulty AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE access_type AS ENUM ('READ', 'WRITE', 'ADMIN');
CREATE TYPE book_category AS ENUM ('GENERAL', 'DATA_SCIENCE', 'WEB_DEVELOPMENT', 'MACHINE_LEARNING', 'HEALTHCARE', 'FINANCE', 'GEOSPATIAL', 'AUTOMATION', 'API_DEVELOPMENT');
CREATE TYPE billing_event_type AS ENUM ('SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_CANCELED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'INVOICE_CREATED', 'TRIAL_STARTED', 'TRIAL_ENDED');
CREATE TYPE section_type AS ENUM ('MARKDOWN', 'PYTHON');
CREATE TYPE execution_mode AS ENUM ('SHARED', 'ISOLATED', 'INHERIT');

-- Organizations table - Tenant boundary and billing entity
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT UNIQUE,
    description TEXT,
    logo TEXT,
    website TEXT,
    industry industry DEFAULT 'GENERAL'::industry,
    
    -- Subscription & Billing
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    subscription_status subscription_status DEFAULT 'TRIAL'::subscription_status,
    subscription_tier subscription_tier DEFAULT 'STARTER'::subscription_tier,
    max_seats INTEGER DEFAULT 5,
    trial_ends_at TIMESTAMPTZ,
    subscription_started_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table - belongs to organizations
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT NOT NULL,
    avatar TEXT,
    role user_role DEFAULT 'LEARNER'::user_role,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Organization relationship
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users(id),
    role user_role DEFAULT 'LEARNER'::user_role,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(email, organization_id)
);

-- Books table
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    difficulty difficulty DEFAULT 'BEGINNER'::difficulty,
    estimated_hours INTEGER,
    category book_category DEFAULT 'GENERAL'::book_category,
    tags TEXT, -- JSON array
    
    -- Content ownership and visibility
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    is_published BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    price INTEGER, -- Price in cents
    
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book Access Control
CREATE TABLE book_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    access_type access_type DEFAULT 'READ'::access_type,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, book_id)
);

-- Chapters table
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    markdown_url TEXT NOT NULL,
    python_url TEXT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    estimated_minutes INTEGER,
    default_execution_mode execution_mode DEFAULT 'SHARED'::execution_mode,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(book_id, display_order)
);

-- Sections table
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT,
    type section_type DEFAULT 'MARKDOWN'::section_type,
    content TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    execution_mode execution_mode DEFAULT 'INHERIT'::execution_mode,
    depends_on TEXT, -- JSON array of section IDs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(chapter_id, display_order)
);

-- Progress tracking
CREATE TABLE progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    time_spent INTEGER, -- Minutes
    score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, chapter_id)
);

-- Exercises table
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 1,
    time_spent INTEGER, -- Seconds
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing events for audit trail
CREATE TABLE billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    event_type billing_event_type NOT NULL,
    amount INTEGER, -- Amount in cents
    currency TEXT DEFAULT 'usd',
    stripe_event_id TEXT,
    metadata TEXT, -- JSON metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_books_organization_id ON books(organization_id);
CREATE INDEX idx_book_access_organization_id ON book_access(organization_id);
CREATE INDEX idx_book_access_user_id ON book_access(user_id);
CREATE INDEX idx_chapters_book_id ON chapters(book_id);
CREATE INDEX idx_sections_chapter_id ON sections(chapter_id);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_billing_events_organization_id ON billing_events(organization_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_book_access_updated_at BEFORE UPDATE ON book_access FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON sections FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();