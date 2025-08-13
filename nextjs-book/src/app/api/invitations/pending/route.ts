import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';

export async function GET(request: NextRequest) {
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
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user can view invitations
    if (!['OWNER', 'ADMIN'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all pending invitations for the organization with inviter details
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        created_at,
        expires_at,
        inviter:users!invitations_invited_by_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', userProfile.organization_id)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch pending invitations' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format (camelCase)
    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      createdAt: invitation.created_at,
      expiresAt: invitation.expires_at,
      invitedBy: invitation.inviter ? {
        firstName: invitation.inviter.first_name,
        lastName: invitation.inviter.last_name,
        email: invitation.inviter.email
      } : null
    }));

    return NextResponse.json({
      success: true,
      data: formattedInvitations
    });

  } catch (error) {
    console.error('Get pending invitations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending invitations' },
      { status: 500 }
    );
  }
}