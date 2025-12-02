import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { z } from 'zod';

const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Code must be 6 digits'),
  orgSlug: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Use service role for auth operations
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

    const body = await request.json();
    // Normalize email to avoid case-sensitive mismatches
    const { email: rawEmail, code, orgSlug } = verifyCodeSchema.parse(body);
    const email = rawEmail.toLowerCase();

    console.log(`🔍 Verifying code: ${code} for email: ${email}`);

    // Find the verification code
    const { data: verificationCode, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log(`🔍 Code lookup result:`, { verificationCode, codeError });

    // Also check what codes exist for this email
    const { data: allCodes } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });
    
    console.log(`🔍 All codes for ${email}:`, allCodes?.map(c => ({
      code: c.code,
      created_at: c.created_at,
      expires_at: c.expires_at,
      used_at: c.used_at,
      attempts: c.attempts
    })));

    if (codeError || !verificationCode) {
      // Get current attempts count and increment it
      const { data: existingCodes } = await supabase
        .from('verification_codes')
        .select('id, attempts')
        .eq('email', email)
        .is('used_at', null);
      
      // Increment attempts for any codes for this email
      if (existingCodes && existingCodes.length > 0) {
        for (const code of existingCodes) {
          await supabase
            .from('verification_codes')
            .update({ attempts: (code.attempts || 0) + 1 })
            .eq('id', code.id);
        }
      }

      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (new Date(verificationCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Check attempts limit (max 5 attempts)
    if (verificationCode.attempts >= 5) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code' },
        { status: 429 }
      );
    }

    // Find the user - proper join syntax for foreign key relationship
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organizations!users_organization_id_fkey(
          id,
          name,
          slug
        )
      `)
      .eq('email', email);

    if (userError) {
      console.error('Database error looking up user:', userError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log(`No user found with email: ${email}`);
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // If orgSlug is provided, filter results by organization
    let user;
    if (orgSlug) {
      user = users.find(u => u.organizations?.slug === orgSlug);
      if (!user) {
        console.log(`User ${email} not found in organization ${orgSlug}. Available orgs:`, users.map(u => u.organizations?.slug));
        return NextResponse.json(
          { error: 'User account not found in the specified organization' },
          { status: 404 }
        );
      }
    } else {
      // If no orgSlug provided, use the first user
      user = users[0];
    }

    console.log(`Verifying user: ${user.email} in organization: ${user.organizations?.slug || 'none'}`);

    // Create a proper Supabase auth session for the user
    console.log(`✅ Verification successful for user: ${user.email}`);
    
    let sessionData = null;
    
    try {
      // Create or get Supabase auth user
      let authUser;
      
      // Prefer looking up by the stored auth_user_id to avoid scanning all auth users
      if (user.auth_user_id) {
        const { data: authUserResult, error: getUserError } = await supabase.auth.admin.getUserById(user.auth_user_id);

        if (getUserError) {
          console.error('Error fetching auth user by id:', getUserError);
        }

        if (authUserResult?.user) {
          console.log('✅ Found existing Supabase auth user by id:', authUserResult.user.id);
          authUser = authUserResult.user;
        }
      }

      // Fallback to email lookup only if we still have not matched an auth user
      if (!authUser) {
        const { data: existingAuthUserByEmail } = await supabase.auth.admin.listUsers();
        const existingUser = existingAuthUserByEmail.users.find(u => u.email?.toLowerCase() === email);

        if (existingUser) {
          console.log('✅ Found existing Supabase auth user via listUsers:', existingUser.id);
          authUser = existingUser;

          // Update the user record auth_user_id if it doesn't match
          if (existingUser.id !== user.auth_user_id) {
            console.log(`🔄 Updating user record auth_user_id from ${user.auth_user_id} to ${existingUser.id}`);
            await supabase
              .from('users')
              .update({ auth_user_id: existingUser.id })
              .eq('email', email)
              .eq('organization_id', user.organization_id);

            // Update our local user object for the session generation
            user.auth_user_id = existingUser.id;
          }
        }
      }

      // If no auth user exists, create one now
      if (!authUser) {
        const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            organization_id: user.organization_id,
            role: user.role
          }
        });

        if (authError || !newAuthUser.user) {
          console.error('Error creating Supabase auth user:', authError);
          // Continue without auth session - at least mark code as used
        } else {
          console.log('✅ Created new Supabase auth user:', newAuthUser.user.id);
          authUser = newAuthUser.user;

          // Update our user record with the new auth user ID
          await supabase
            .from('users')
            .update({ auth_user_id: newAuthUser.user.id })
            .eq('email', email)
            .eq('organization_id', user.organization_id);

          // Update our local user object for the session generation
          user.auth_user_id = newAuthUser.user.id;
        }
      }

      // Create a direct session for the user using admin API
      if (authUser) {
        // Generate a one-time login link that we can exchange for a session
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: authUser.email!
        });

        if (linkError) {
          console.error('Error generating login link:', linkError);
        } else {
          console.log('✅ Auth login link created successfully');
          sessionData = linkData;
        }
      }
    } catch (authError) {
      console.error('Auth session creation failed:', authError);
      // Continue without auth session
    }

    // Mark verification code as used
    await supabase
      .from('verification_codes')
      .update({ 
        used_at: new Date().toISOString(),
        attempts: verificationCode.attempts + 1
      })
      .eq('id', verificationCode.id);

    // Update user's last login time
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const orgSlugForRedirect = user.organizations?.slug;
    let fallbackRedirectUrl;
    if (orgSlugForRedirect) {
      // Role-based redirect: learners go to progress, others go to dashboard
      if (user.role === 'LEARNER') {
        fallbackRedirectUrl = `/org/${orgSlugForRedirect}/progress`;
      } else {
        fallbackRedirectUrl = `/org/${orgSlugForRedirect}/dashboard`;
      }
    } else {
      fallbackRedirectUrl = '/dashboard';
    }

    // Return success with appropriate redirect
    let authUrl = null;
    if (sessionData?.properties?.action_link) {
      // Extract the verification hash from the magic link
      const url = new URL(sessionData.properties.action_link);
      const token = url.searchParams.get('token');
      const type = url.searchParams.get('type');
      
      if (token && type) {
        // Create auth callback URL with the token
        authUrl = `/auth/callback?token=${token}&type=${type}&redirect_to=${encodeURIComponent(fallbackRedirectUrl)}`;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
      redirectUrl: authUrl || fallbackRedirectUrl,
      requiresAuth: !!authUrl,
      user: {
        id: user.id,
        email: user.email,
        organization: user.organizations
      }
    });

  } catch (error) {
    console.error('❌ Verify code error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to verify code: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}