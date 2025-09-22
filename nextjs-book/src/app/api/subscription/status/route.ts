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

    // Get the latest billing event to determine actual status
    const { data: latestBillingEvent } = await supabase
      .from('billing_events')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Parse billing metadata to get actual status and tier
    let billingStatus = organization.subscription_status;
    let billingTier = organization.subscription_tier;
    let billingMetadata = null;

    if (latestBillingEvent && latestBillingEvent.metadata) {
      const metadata = typeof latestBillingEvent.metadata === 'string'
        ? JSON.parse(latestBillingEvent.metadata)
        : latestBillingEvent.metadata;

      if (metadata.status) {
        billingStatus = metadata.status.toUpperCase();
        billingMetadata = {
          status: metadata.status,
          tier: metadata.tier || billingTier
        };
      }
      if (metadata.tier) {
        billingTier = metadata.tier.toUpperCase();
      }
    }

    const subscriptionStatus = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        currentSeats: userCount || 0,
        maxSeats: organization.max_seats || 100,
        subscriptionStatus: billingStatus,
        subscriptionTier: billingTier,
        createdAt: organization.created_at,
        hasStripeCustomer: !!organization.stripe_customer_id,
        trialEndsAt: organization.trial_ends_at,
      },
      billing: billingMetadata,
      permissions: {
        canManageBilling: user.role === 'OWNER',
        canInviteUsers: ['OWNER', 'ADMIN'].includes(user.role),
        canManageContent: ['OWNER', 'ADMIN'].includes(user.role),
      },
      features: {
        maxUsers: organization.max_seats || 100,
        maxBooks: 10,
        analyticsEnabled: true,
        advancedReports: billingTier === 'PRO' || billingTier === 'ENTERPRISE'
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