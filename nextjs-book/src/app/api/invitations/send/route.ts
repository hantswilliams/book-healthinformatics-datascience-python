import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { sendEmail } from '@/lib/email';
import { createInvitationEmail } from '@/lib/email-templates';
import { z } from 'zod';
import crypto from 'crypto';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'INSTRUCTOR', 'LEARNER']).default('LEARNER'),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check role and organization
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, organization_id, first_name, last_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user can send invitations (OWNER or ADMIN)
    if (!['OWNER', 'ADMIN'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);

    // Get user's organization with current user count
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, max_seats')
      .eq('id', userProfile.organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get current user count for the organization
    const { count: userCount, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', userProfile.organization_id);

    if (countError) {
      console.error('Error counting users:', countError);
      return NextResponse.json(
        { error: 'Failed to check seat limit' },
        { status: 500 }
      );
    }

    // Check if organization has reached seat limit
    if (userCount && userCount >= organization.max_seats) {
      return NextResponse.json(
        { error: `Seat limit reached. Your plan allows ${organization.max_seats} users.` },
        { status: 400 }
      );
    }

    // Check if user is already a member of this or another organization
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('organization_id, id')
      .eq('email', email)
      .maybeSingle();

    if (userCheckError) {
      console.error('Error checking existing user:', userCheckError);
    }

    if (existingUser && existingUser.organization_id === userProfile.organization_id) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    if (existingUser && existingUser.organization_id !== userProfile.organization_id) {
      return NextResponse.json(
        { error: 'User is already a member of another organization' },
        { status: 400 }
      );
    }

    // Generate a unique user ID for the new user
    const newUserId = crypto.randomUUID();
    
    // Create user directly in the users table
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        id: newUserId,
        email,
        username: email.split('@')[0],
        first_name: null,
        last_name: email.split('@')[0], // Use email prefix as temporary last name
        organization_id: userProfile.organization_id,
        role,
        invited_by: user.id,
        is_active: true,
        onboarding_completed: false
      })
      .select()
      .single();

    if (createUserError || !newUser) {
      console.error('Error creating user:', createUserError);
      
      // Check if it's a duplicate key constraint violation
      if (createUserError?.code === '23505') {
        return NextResponse.json(
          { error: 'A user with this email already exists. Please check and try again.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Send welcome email to the newly created user
    console.log(`Sending welcome email to newly created user ${email} with role: ${role}`);
    
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/org/${organization.slug || organization.id}/login`;
    
    try {
      const { createWelcomeEmail } = await import('@/lib/email-templates');
      
      const emailHtml = createWelcomeEmail({
        userName: email.split('@')[0],
        organizationName: organization.name,
        loginUrl
      });
      
      console.log(`📧 Generated welcome email for ${email}`);
      console.log(`📋 Email subject: Welcome to ${organization.name}!`);

      const emailResult = await sendEmail({
        to: email,
        subject: `Welcome to ${organization.name}!`,
        html: emailHtml
      });

      if (!emailResult.success) {
        console.error('Failed to send welcome email:', emailResult.error);
        // Continue with the response even if email fails
      }
      
      // In development, log the login URL for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 Login URL for ${email}: ${loginUrl}`);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue with the response even if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at,
        loginUrl,
        method: 'direct_user_creation'
      }
    });

  } catch (error) {
    console.error('Invitation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}