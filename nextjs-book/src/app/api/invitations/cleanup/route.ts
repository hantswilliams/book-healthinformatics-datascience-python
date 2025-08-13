import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';

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
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user can manage invitations
    if (!['OWNER', 'ADMIN'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Clean up all invitations for this email/org combination
    const { data: deletedInvitations, error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('email', email)
      .eq('organization_id', userProfile.organization_id)
      .select('id');

    if (deleteError) {
      console.error('Error cleaning up invitations:', deleteError);
      return NextResponse.json(
        { error: 'Failed to cleanup invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedInvitations?.length || 0} invitations for ${email}`,
      data: { count: deletedInvitations?.length || 0 }
    });

  } catch (error) {
    console.error('Invitation cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup invitations' },
      { status: 500 }
    );
  }
}