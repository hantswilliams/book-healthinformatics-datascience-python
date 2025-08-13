import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client for server-side authentication
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { firstName, lastName, email } = await request.json();

    if (!lastName || !email) {
      return NextResponse.json(
        { error: 'Last name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', user.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already in use by another account' },
        { status: 400 }
      );
    }

    // Update user in Supabase Auth (for email)
    if (email !== user.email) {
      const { error: updateAuthError } = await supabase.auth.updateUser({
        email: email
      });
      
      if (updateAuthError) {
        return NextResponse.json(
          { error: 'Failed to update email in authentication system' },
          { status: 400 }
        );
      }
    }

    // Update user profile in our users table
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName || null,
        last_name: lastName,
        email,
      })
      .eq('id', user.id)
      .select('id, username, email, first_name, last_name, role')
      .single();

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully', 
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}