import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { z } from 'zod';

const checkUserRoleSchema = z.object({
  email: z.string().email(),
  orgSlug: z.string(),
});

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

    const body = await request.json();
    const { email, orgSlug } = checkUserRoleSchema.parse(body);

    // Find the user's role in the specified organization
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        role,
        organizations!users_organization_id_fkey(
          id,
          name,
          slug
        )
      `)
      .eq('email', email)
      .eq('organizations.slug', orgSlug);

    if (userError) {
      console.error('Database error looking up user role:', userError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { 
          found: false,
          message: 'No account found with this email address in this organization'
        },
        { status: 404 }
      );
    }

    const user = users[0];

    return NextResponse.json({
      found: true,
      role: user.role,
      organization: user.organizations,
      authMethods: {
        passwordLogin: user.role !== 'LEARNER', // Only non-learners can use password
        codeLogin: true // Everyone can use verification codes
      }
    });

  } catch (error) {
    console.error('❌ Check user role error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Failed to check user role: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}