import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const { email, orgSlug } = await request.json();

    console.log(`🔍 Debug: Looking up user with email: ${email}, orgSlug: ${orgSlug}`);

    // First, let's see all users with this email - proper join syntax
    const { data: allUsers, error: allUsersError } = await supabase
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

    console.log(`🔍 All users query error:`, allUsersError);
    console.log(`🔍 All users found:`, allUsers);

    // Also check if the organization exists
    if (orgSlug) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', orgSlug)
        .single();

      console.log(`🔍 Organization query error:`, orgError);
      console.log(`🔍 Organization found:`, org);
    }

    // Check database connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    console.log(`🔍 Connection test error:`, connectionError);
    console.log(`🔍 Connection test result:`, connectionTest);

    return NextResponse.json({
      success: true,
      debug: {
        email,
        orgSlug,
        allUsers,
        allUsersError,
        connectionTest,
        connectionError,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}