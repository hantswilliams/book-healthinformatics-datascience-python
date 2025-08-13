import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions for our database
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          domain: string | null;
          description: string | null;
          logo: string | null;
          website: string | null;
          industry: 'GENERAL' | 'HEALTHCARE' | 'FINANCE' | 'TECHNOLOGY' | 'EDUCATION' | 'MANUFACTURING' | 'GOVERNMENT' | 'NON_PROFIT';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
          subscription_tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
          max_seats: number;
          trial_ends_at: string | null;
          subscription_started_at: string | null;
          subscription_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          domain?: string | null;
          description?: string | null;
          logo?: string | null;
          website?: string | null;
          industry?: 'GENERAL' | 'HEALTHCARE' | 'FINANCE' | 'TECHNOLOGY' | 'EDUCATION' | 'MANUFACTURING' | 'GOVERNMENT' | 'NON_PROFIT';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
          subscription_tier?: 'STARTER' | 'PRO' | 'ENTERPRISE';
          max_seats?: number;
          trial_ends_at?: string | null;
          subscription_started_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          domain?: string | null;
          description?: string | null;
          logo?: string | null;
          website?: string | null;
          industry?: 'GENERAL' | 'HEALTHCARE' | 'FINANCE' | 'TECHNOLOGY' | 'EDUCATION' | 'MANUFACTURING' | 'GOVERNMENT' | 'NON_PROFIT';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
          subscription_tier?: 'STARTER' | 'PRO' | 'ENTERPRISE';
          max_seats?: number;
          trial_ends_at?: string | null;
          subscription_started_at?: string | null;
          subscription_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          first_name: string | null;
          last_name: string;
          avatar: string | null;
          role: 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
          is_active: boolean;
          last_login_at: string | null;
          onboarding_completed: boolean;
          organization_id: string;
          joined_at: string;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          first_name?: string | null;
          last_name: string;
          avatar?: string | null;
          role?: 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
          is_active?: boolean;
          last_login_at?: string | null;
          onboarding_completed?: boolean;
          organization_id: string;
          joined_at?: string;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string;
          avatar?: string | null;
          role?: 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
          is_active?: boolean;
          last_login_at?: string | null;
          onboarding_completed?: boolean;
          organization_id?: string;
          joined_at?: string;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chapters: {
        Row: {
          id: string;
          book_id: string;
          title: string;
          emoji: string;
          display_order: number;
          markdown_url: string;
          python_url: string;
          is_published: boolean;
          estimated_minutes: number | null;
          default_execution_mode: 'SHARED' | 'ISOLATED' | 'INHERIT';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          title: string;
          emoji: string;
          display_order: number;
          markdown_url: string;
          python_url: string;
          is_published?: boolean;
          estimated_minutes?: number | null;
          default_execution_mode?: 'SHARED' | 'ISOLATED' | 'INHERIT';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          title?: string;
          emoji?: string;
          display_order?: number;
          markdown_url?: string;
          python_url?: string;
          is_published?: boolean;
          estimated_minutes?: number | null;
          default_execution_mode?: 'SHARED' | 'ISOLATED' | 'INHERIT';
          created_at?: string;
          updated_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          cover_image: string | null;
          difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
          estimated_hours: number | null;
          category: 'GENERAL' | 'DATA_SCIENCE' | 'WEB_DEVELOPMENT' | 'MACHINE_LEARNING' | 'HEALTHCARE' | 'FINANCE' | 'GEOSPATIAL' | 'AUTOMATION' | 'API_DEVELOPMENT';
          tags: string | null;
          organization_id: string | null;
          created_by: string;
          is_published: boolean;
          is_public: boolean;
          price: number | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          cover_image?: string | null;
          difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
          estimated_hours?: number | null;
          category?: 'GENERAL' | 'DATA_SCIENCE' | 'WEB_DEVELOPMENT' | 'MACHINE_LEARNING' | 'HEALTHCARE' | 'FINANCE' | 'GEOSPATIAL' | 'AUTOMATION' | 'API_DEVELOPMENT';
          tags?: string | null;
          organization_id?: string | null;
          created_by: string;
          is_published?: boolean;
          is_public?: boolean;
          price?: number | null;
          display_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          cover_image?: string | null;
          difficulty?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
          estimated_hours?: number | null;
          category?: 'GENERAL' | 'DATA_SCIENCE' | 'WEB_DEVELOPMENT' | 'MACHINE_LEARNING' | 'HEALTHCARE' | 'FINANCE' | 'GEOSPATIAL' | 'AUTOMATION' | 'API_DEVELOPMENT';
          tags?: string | null;
          organization_id?: string | null;
          created_by?: string;
          is_published?: boolean;
          is_public?: boolean;
          price?: number | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      sections: {
        Row: {
          id: string;
          chapter_id: string;
          title: string | null;
          type: 'MARKDOWN' | 'PYTHON';
          content: string;
          display_order: number;
          execution_mode: 'SHARED' | 'ISOLATED' | 'INHERIT';
          depends_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          title?: string | null;
          type?: 'MARKDOWN' | 'PYTHON';
          content: string;
          display_order: number;
          execution_mode?: 'SHARED' | 'ISOLATED' | 'INHERIT';
          depends_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          title?: string | null;
          type?: 'MARKDOWN' | 'PYTHON';
          content?: string;
          display_order?: number;
          execution_mode?: 'SHARED' | 'ISOLATED' | 'INHERIT';
          depends_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          book_id: string;
          chapter_id: string;
          completed: boolean;
          completed_at: string | null;
          time_spent: number | null;
          score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          book_id: string;
          chapter_id: string;
          completed?: boolean;
          completed_at?: string | null;
          time_spent?: number | null;
          score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          book_id?: string;
          chapter_id?: string;
          completed?: boolean;
          completed_at?: string | null;
          time_spent?: number | null;
          score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      book_access: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          book_id: string;
          access_type: 'read' | 'write' | 'admin';
          granted_at: string;
          granted_by: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          book_id: string;
          access_type?: 'read' | 'write' | 'admin';
          granted_at?: string;
          granted_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          book_id?: string;
          access_type?: 'read' | 'write' | 'admin';
          granted_at?: string;
          granted_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          organization_id: string;
          invited_by: string;
          role: 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
          token: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          organization_id: string;
          invited_by: string;
          role?: 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
          token: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          organization_id?: string;
          invited_by?: string;
          role?: 'OWNER' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';
          token?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      verification_codes: {
        Row: {
          id: string;
          email: string;
          code: string;
          expires_at: string;
          used_at: string | null;
          attempts: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          code: string;
          expires_at: string;
          used_at?: string | null;
          attempts?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          code?: string;
          expires_at?: string;
          used_at?: string | null;
          attempts?: number;
          created_at?: string;
        };
      };
    };
  };
};