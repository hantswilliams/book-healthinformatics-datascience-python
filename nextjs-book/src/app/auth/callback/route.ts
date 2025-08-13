import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const redirect_to = searchParams.get('redirect_to');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');
    
    // Handle auth errors
    if (error) {
      console.error('Auth callback error:', error, error_description);
      return NextResponse.redirect(`${origin}/error?message=${encodeURIComponent(error_description || error)}`);
    }

    if (!code && !token) {
      return NextResponse.redirect(`${origin}/error?message=No authorization code or token provided`);
    }

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

    let authData;
    let authError;

    if (code) {
      // Exchange the code for a session (standard OAuth flow)
      const result = await supabase.auth.exchangeCodeForSession(code);
      authData = result.data;
      authError = result.error;
    } else if (token && type) {
      // Verify the token (magic link flow)
      const result = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as any
      });
      authData = result.data;
      authError = result.error;
    }
    
    if (authError || !authData.user) {
      console.error('Error exchanging code for session:', authError);
      return NextResponse.redirect(`${origin}/error?message=Authentication failed`);
    }

    const user = authData.user;

    // Check if user exists in our users table (this covers both existing auth users and pre-created users)
    const { data: existingUser, error: userLookupError } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(
          slug,
          id,
          name
        )
      `)
      .eq('email', user.email!)
      .single();

    if (userLookupError && userLookupError.code !== 'PGRST116') {
      console.error('Error looking up user:', userLookupError);
      return NextResponse.redirect(`${origin}/error?message=Database error during authentication`);
    }

    if (existingUser) {
      // User exists in our system - update their Supabase auth ID if needed
      if (existingUser.id !== user.id) {
        console.log(`Updating user ${existingUser.email} auth ID from ${existingUser.id} to ${user.id}`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({
            id: user.id,
            last_login_at: new Date().toISOString()
          })
          .eq('email', user.email!);

        if (updateError) {
          console.error('Error updating user auth ID:', updateError);
          return NextResponse.redirect(`${origin}/error?message=Failed to sync user account`);
        }
      } else {
        // Just update last login time
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Use redirect_to parameter if provided, otherwise determine redirect path based on role
      let redirectPath;
      if (redirect_to) {
        redirectPath = decodeURIComponent(redirect_to);
      } else {
        const orgSlug = existingUser.organization?.slug;
        if (orgSlug) {
          // Role-based redirect: learners go to progress, others go to dashboard
          if (existingUser.role === 'LEARNER') {
            redirectPath = `/org/${orgSlug}/progress`;
          } else {
            redirectPath = `/org/${orgSlug}/dashboard`;
          }
        } else {
          redirectPath = `/dashboard`;
        }
      }

      const isFirstLogin = existingUser.last_login_at === null;
      const welcomeParam = isFirstLogin ? '?welcome=true' : '';
      
      return NextResponse.redirect(`${origin}${redirectPath}${welcomeParam}`);
    } else {
      // New user - this shouldn't happen with our new flow but handle gracefully
      console.log('New user signing in via magic link - no pre-existing user record');
      
      // For new users, redirect to registration or dashboard
      // Since we're now creating users directly, this case should be rare
      return NextResponse.redirect(`${origin}/register?email=${encodeURIComponent(user.email!)}`);
    }
    
  } catch (error) {
    console.error('Auth callback error:', error);
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/error?message=Something went wrong`);
  }
}