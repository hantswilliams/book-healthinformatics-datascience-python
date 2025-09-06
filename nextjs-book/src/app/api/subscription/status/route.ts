import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    // Get authenticated user using the helper function
    const { user, error: authError } = await getAuthenticatedUser(orgSlug);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    // Count active users in the organization
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization.id)
      .eq('is_active', true);

    // For now, return a basic subscription status
    // This can be enhanced later with actual subscription logic
    const subscriptionStatus = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        currentSeats: userCount || 0,
        maxSeats: 100, // Default for free tier
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: 'FREE',
        createdAt: organization.created_at,
      },
      permissions: {
        canManageBilling: user.role === 'OWNER',
        canInviteUsers: ['OWNER', 'ADMIN'].includes(user.role),
        canManageContent: ['OWNER', 'ADMIN'].includes(user.role),
      },
      features: {
        maxUsers: 100,
        maxBooks: 10,
        analyticsEnabled: true,
        advancedReports: false
      }
    };

    return NextResponse.json({
      success: true,
      data: subscriptionStatus
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}