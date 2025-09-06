import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { stripe } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
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

    // Get user with organization details using auth_user_id and org context
    let userWithOrg, userError;
    
    if (orgSlug) {
      // First get the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single();
      
      if (orgError || !org) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      
      // Then get the user profile for this organization
      const result = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('auth_user_id', user.id)
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .single();
        
      userWithOrg = result.data;
      userError = result.error;
    } else {
      // Fallback to first user profile
      const result = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();
        
      userWithOrg = result.data;
      userError = result.error;
    }

    if (userError || !userWithOrg || !userWithOrg.organization) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only organization owners can access billing
    if (userWithOrg.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can access billing' },
        { status: 403 }
      );
    }

    const organization = userWithOrg.organization;

    if (!organization.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 400 }
      );
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('_key')) {
      return NextResponse.json({
        error: 'Stripe is not properly configured. Please check your environment variables.',
        details: 'STRIPE_SECRET_KEY is missing or invalid'
      }, { status: 503 });
    }

    // Get the base URL for return URL - prioritize NEXT_PUBLIC_APP_URL for stable production domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: organization.stripe_customer_id,
      return_url: `${baseUrl}/org/${organization.slug}/dashboard/billing`,
    });

    return NextResponse.json({
      success: true,
      data: {
        url: portalSession.url
      }
    });

  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}