import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';

export async function PATCH(request: NextRequest) {
  try {
    // Extract organization slug from the referer header
    const referer = request.headers.get('referer');
    let orgSlug: string | undefined = undefined;
    
    if (referer) {
      const urlMatch = referer.match(/\/org\/([^\/]+)/);
      if (urlMatch && urlMatch[1]) {
        orgSlug = urlMatch[1];
      }
    }

    const { user, error: authError } = await getAuthenticatedUser(orgSlug);
    if (authError || !user) {
      console.error('Auth error in user update:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User update - authenticated user:', {
      id: user.id,
      email: user.email,
      organizationId: user.organization_id,
      role: user.role
    });

    const supabase = await createClient();

    const { firstName, lastName, email } = await request.json();

    if (!lastName || !email) {
      return NextResponse.json(
        { error: 'Last name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user in the same organization
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('organization_id', user.organization_id)
      .neq('id', user.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already in use by another account in this organization' },
        { status: 400 }
      );
    }

    // Update user profile in our users table
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        first_name: firstName || null,
        last_name: lastName,
        email,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('id, username, email, first_name, last_name, role')
      .single();

    if (updateError || !updatedUser) {
      console.error('Profile update error:', updateError);
      console.error('Updated user result:', updatedUser);
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError?.message || 'Unknown error' },
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