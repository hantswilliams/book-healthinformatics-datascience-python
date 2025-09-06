import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import crypto from 'crypto';

type Database = {
  public: {
    Tables: {
      organizations: {
        Insert: {
          id?: string;
          name: string;
          slug: string;
          industry: string;
          website?: string;
          subscription_status: string;
          subscription_tier: string;
          max_seats: number;
          trial_ends_at: string;
        };
      };
      users: {
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          username: string;
          role: string;
          organization_id: string;
          onboarding_completed: boolean;
        };
      };
    };
  };
};

const registerSchema = z.object({
  // Organization details
  organizationName: z.string().min(2).max(100),
  organizationSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  industry: z.enum(['GENERAL', 'HEALTHCARE', 'FINANCE', 'TECHNOLOGY', 'EDUCATION', 'MANUFACTURING', 'GOVERNMENT', 'NON_PROFIT']),
  website: z.string().url().optional(),
  
  // Owner details
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  
  // Subscription details
  subscriptionTier: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).default('STARTER'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Create Supabase admin client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if organization slug is available
    const { data: existingOrgBySlug } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', validatedData.organizationSlug)
      .single();

    if (existingOrgBySlug) {
      return NextResponse.json(
        { error: 'Organization slug already taken' },
        { status: 400 }
      );
    }

    // Note: We no longer check for existing email globally since users can belong to multiple orgs
    // We'll check after creating the organization to ensure email+org combo is unique

    // Set trial period (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Set max seats based on tier
    const maxSeats = {
      STARTER: 5,
      PRO: 25,
      ENTERPRISE: 999 // "unlimited" 
    }[validatedData.subscriptionTier];

    // Create organization first
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: validatedData.organizationName,
        slug: validatedData.organizationSlug,
        industry: validatedData.industry,
        website: validatedData.website,
        subscription_status: 'TRIAL',
        subscription_tier: validatedData.subscriptionTier,
        max_seats: maxSeats,
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .select('id, slug, trial_ends_at')
      .single();

    if (orgError || !organization) {
      console.error('Organization creation error:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Check if email+organization combination already exists
    const { data: existingEmailOrg } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .eq('organization_id', organization.id)
      .single();

    if (existingEmailOrg) {
      // Cleanup: delete the organization since email+org combo already exists
      await supabase.from('organizations').delete().eq('id', organization.id);
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 400 }
      );
    }

    // Check if username+organization combination already exists
    const { data: existingUsernameOrg } = await supabase
      .from('users')
      .select('id')
      .eq('username', validatedData.username)
      .eq('organization_id', organization.id)
      .single();

    if (existingUsernameOrg) {
      // Cleanup: delete the organization since username+org combo already exists
      await supabase.from('organizations').delete().eq('id', organization.id);
      return NextResponse.json(
        { error: 'Username already taken in this organization' },
        { status: 400 }
      );
    }

    // Create user in Supabase Auth first (or get existing one)
    let authUser;
    
    // Check if auth user already exists
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers.users.find(u => u.email === validatedData.email);
    
    if (existingAuthUser) {
      console.log('Using existing Supabase auth user:', existingAuthUser.id);
      authUser = existingAuthUser;
      
      // For existing auth users, we need to update their password if they're becoming an owner
      if (validatedData.password) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingAuthUser.id,
          { password: validatedData.password }
        );
        
        if (updateError) {
          console.warn('Failed to update password for existing user:', updateError);
          // Continue anyway - they can reset password later
        }
      }
    } else {
      // Create new auth user
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true, // Auto-confirm email
      });

      if (authError || !newAuthUser.user) {
        console.error('Auth user creation error:', authError);
        // Cleanup: delete the organization if auth user creation failed
        await supabase.from('organizations').delete().eq('id', organization.id);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      
      authUser = newAuthUser.user;
    }

    // Create user record in our custom users table
    // For multi-org support, each user gets a separate record per organization
    const userRecordId = crypto.randomUUID(); // Always use a new UUID for user records
    
    console.log('Creating user profile with record ID:', userRecordId);
    console.log('Auth user ID:', authUser.id);
    console.log('User data:', {
      id: userRecordId,
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      email: validatedData.email,
      username: validatedData.username,
      role: 'OWNER',
      organization_id: organization.id,
      onboarding_completed: false,
    });
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userRecordId, // Use a unique ID for each org-specific user record
        auth_user_id: authUser.id, // Track the Supabase Auth user ID
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        email: validatedData.email,
        username: validatedData.username,
        role: 'OWNER',
        organization_id: organization.id,
        onboarding_completed: false,
      })
      .select('id')
      .single();

    if (userError || !user) {
      console.error('User profile creation error:', userError);
      // Cleanup: delete the organization if profile creation failed
      // NOTE: We don't delete the auth user if it was existing, only if we created it
      if (!existingAuthUser) {
        await supabase.auth.admin.deleteUser(authUser.id);
      }
      await supabase.from('organizations').delete().eq('id', organization.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    const result = { organization, user };

    // Return success response (excluding sensitive data)
    return NextResponse.json({
      success: true,
      message: existingAuthUser ? 
        'Organization created successfully. Your existing account has been linked to this new organization.' :
        'Organization and account created successfully.',
      data: {
        organizationId: result.organization.id,
        organizationSlug: result.organization.slug,
        userId: result.user.id,
        trialEndsAt: result.organization.trial_ends_at,
        isExistingUser: !!existingAuthUser,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}