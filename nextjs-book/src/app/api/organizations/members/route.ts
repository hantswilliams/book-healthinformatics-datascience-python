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

    // Check if user can view team members
    if (!['OWNER', 'ADMIN'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all team members for the organization
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        username,
        role,
        is_active,
        joined_at,
        last_login_at,
        invited_by
      `)
      .eq('organization_id', userProfile.organization_id)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // Get course counts for all members in parallel
    const memberIds = members.map(member => member.id);
    const { data: courseCounts, error: courseCountError } = await supabase
      .from('book_access')
      .select('user_id')
      .eq('organization_id', userProfile.organization_id)
      .in('user_id', memberIds);

    if (courseCountError) {
      console.error('Error fetching course counts:', courseCountError);
      return NextResponse.json(
        { error: 'Failed to fetch course counts' },
        { status: 500 }
      );
    }

    // Create a map of user_id to course count
    const courseCountMap = (courseCounts || []).reduce((acc, access) => {
      acc[access.user_id] = (acc[access.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Transform the data to match the expected format (camelCase)
    const formattedMembers = members.map(member => ({
      id: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      username: member.username,
      role: member.role,
      isActive: member.is_active,
      joinedAt: member.joined_at,
      lastLoginAt: member.last_login_at,
      invitedBy: member.invited_by,
      courseCount: courseCountMap[member.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: formattedMembers
    });

  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}