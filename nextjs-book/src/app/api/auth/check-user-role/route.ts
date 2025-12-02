import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { z } from 'zod';

const checkUserRoleSchema = z.object({
  email: z.string().email(),
  orgSlug: z.string(),
});

export async function GET(request: NextRequest) {
  console.log('❌ GET request to check-user-role endpoint');
  console.log('📍 URL:', request.url);
  console.log('🔗 Referer:', request.headers.get('referer'));
  console.log('🤖 User-Agent:', request.headers.get('user-agent'));
  
  return NextResponse.json(
    { 
      error: 'Method not allowed. This endpoint requires POST method.',
      receivedMethod: 'GET',
      expectedMethod: 'POST',
      url: request.url,
      referer: request.headers.get('referer')
    },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  console.log('✅ POST request to check-user-role endpoint');
  console.log('📍 URL:', request.url);
  console.log('🕐 Request timestamp:', new Date().toISOString());
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

    console.log('📨 About to parse request body...');
    const body = await request.json();
    console.log('📄 Raw request body:', body);
    
    const { email: rawEmail, orgSlug } = checkUserRoleSchema.parse(body);
    const email = rawEmail.toLowerCase();
    console.log('✅ Parsed request data:', { email, orgSlug });

    console.log(`🔍 Looking for organization with slug: "${orgSlug}"`);
    console.log(`📧 Email: "${email}"`);

    // First, get the organization by slug
    console.log('🔍 About to query organizations table...');
    console.log('🎯 Query: SELECT id, name, slug FROM organizations WHERE slug =', orgSlug);
    
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', orgSlug)
      .single();
      
    console.log('🏢 Organization query completed');
    console.log('📊 Data:', organization);
    console.log('❌ Error:', orgError);

    console.log(`📊 Organization query result:`, { organization, orgError });

    if (orgError || !organization) {
      console.error('❌ Organization not found for slug:', orgSlug);
      console.error('Database error:', orgError);
      
      // Let's also check what organizations exist for debugging
      const { data: allOrgs } = await supabase
        .from('organizations')
        .select('id, name, slug');
      console.log('🗂️ All organizations in database:', allOrgs);
      
      return NextResponse.json(
        { 
          found: false,
          message: `Organization not found for slug: ${orgSlug}`,
          debug: {
            requestedSlug: orgSlug,
            availableOrgs: allOrgs?.map(org => org.slug) || []
          }
        },
        { status: 404 }
      );
    }

    // Then find the user's role in this specific organization
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role, auth_user_id')
      .eq('email', email)
      .eq('organization_id', organization.id);

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
      organization: organization,
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