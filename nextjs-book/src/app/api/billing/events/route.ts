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

    // Get user with organization details
    const { data: userWithOrg, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (userError || !userWithOrg || !userWithOrg.organization) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only organization owners can view billing events
    if (userWithOrg.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can view billing events' },
        { status: 403 }
      );
    }

    // TODO: Implement billing events tracking with Supabase when needed
    // For now, return empty billing events to prevent errors
    const formattedEvents: any[] = [];
    
    // Mock data could be added here if needed:
    // const formattedEvents = [
    //   {
    //     id: 'trial-start-1',
    //     eventType: 'TRIAL_STARTED',
    //     amount: 0,
    //     currency: 'usd',
    //     stripeEventId: null,
    //     metadata: null,
    //     createdAt: userWithOrg.organization.created_at
    //   }
    // ];

    return NextResponse.json({
      success: true,
      data: formattedEvents
    });

  } catch (error) {
    console.error('Get billing events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing events' },
      { status: 500 }
    );
  }
}