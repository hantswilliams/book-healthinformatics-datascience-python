import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, firstName, lastName, organizationId, role = 'LEARNER' } = await request.json();

    if (!email || !password || !username || !lastName || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if email+organization combination already exists
    const { data: existingEmailOrg } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .single();

    if (existingEmailOrg) {
      return NextResponse.json(
        { error: 'User already exists in this organization' },
        { status: 400 }
      );
    }

    // Check if username+organization combination already exists
    const { data: existingUsernameOrg } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .eq('organization_id', organizationId)
      .single();

    if (existingUsernameOrg) {
      return NextResponse.json(
        { error: 'Username already taken in this organization' },
        { status: 400 }
      );
    }

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user profile in database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        auth_user_id: authData.user.id, // For new users, id and auth_user_id are the same
        email,
        username,
        first_name: firstName || null,
        last_name: lastName,
        organization_id: organizationId,
        role,
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'User created successfully', 
      user: {
        id: userProfile.id,
        email: userProfile.email,
        username: userProfile.username,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role,
        organizationId: userProfile.organization_id,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}