import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    
    // Use service role key for public organization info
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('name, industry, logo, subscription_status')
      .eq('slug', slug)
      .single();

    if (error || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: organization.name,
      industry: organization.industry,
      logo: organization.logo,
      subscriptionStatus: organization.subscription_status,
    });

  } catch (error) {
    console.error('Error fetching public organization info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization info' },
      { status: 500 }
    );
  }
}