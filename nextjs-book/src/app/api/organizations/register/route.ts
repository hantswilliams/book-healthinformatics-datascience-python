import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

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

    // Check if user email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Check if username is taken
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', validatedData.username)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }


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

    // Create user in Supabase Auth first
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError || !authUser.user) {
      console.error('Auth user creation error:', authError);
      // Cleanup: delete the organization if auth user creation failed
      await supabase.from('organizations').delete().eq('id', organization.id);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create user record in our custom users table
    console.log('Creating user profile with auth ID:', authUser.user.id);
    console.log('User data:', {
      id: authUser.user.id,
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
        id: authUser.user.id, // Use the auth user's ID
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
      // Cleanup: delete the auth user and organization if profile creation failed
      await supabase.auth.admin.deleteUser(authUser.user.id);
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
      data: {
        organizationId: result.organization.id,
        organizationSlug: result.organization.slug,
        userId: result.user.id,
        trialEndsAt: result.organization.trial_ends_at,
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