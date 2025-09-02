import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/stripe-server';
import type { Database } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client for server-side authentication
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    // Get the authenticated user
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
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organization = userWithOrg.organization;
    
    console.log('🏢 Organization data from DB:', {
      id: organization.id,
      name: organization.name,
      subscription_status: organization.subscription_status,
      subscription_tier: organization.subscription_tier,
      max_seats: organization.max_seats,
      trial_ends_at: organization.trial_ends_at,
      subscription_ends_at: organization.subscription_ends_at,
      stripe_subscription_id: organization.stripe_subscription_id,
      updated_at: organization.updated_at,
    });

    // Auto-sync: Check if billing events are newer than organization data
    const { data: latestBillingEvent } = await supabase
      .from('billing_events')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestBillingEvent && organization.updated_at) {
      const orgUpdated = new Date(organization.updated_at);
      const eventCreated = new Date(latestBillingEvent.created_at);
      
      if (eventCreated > orgUpdated) {
        console.log('🔄 Auto-syncing: Billing event is newer than org data');
        
        // Parse metadata and update organization
        const metadata = typeof latestBillingEvent.metadata === 'string' 
          ? JSON.parse(latestBillingEvent.metadata) 
          : latestBillingEvent.metadata;

        const subscriptionTier = metadata?.subscriptionTier as 'STARTER' | 'PRO' || 'STARTER';
        const maxSeats = subscriptionTier === 'STARTER' ? 25 : 500;

        console.log('📊 Auto-applying tier:', subscriptionTier, 'with seats:', maxSeats);

        await supabase
          .from('organizations')
          .update({
            subscription_tier: subscriptionTier,
            max_seats: maxSeats,
            updated_at: new Date().toISOString(),
          })
          .eq('id', organization.id);

        // Update local organization object for response
        organization.subscription_tier = subscriptionTier;
        organization.max_seats = maxSeats;
      }
    }
    
    // Count active users in the organization
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization.id)
      .eq('is_active', true);

    let stripeSubscription = null;
    if (organization.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          organization.stripe_subscription_id,
          { expand: ['latest_invoice', 'customer'] }
        );
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    if (organization.trial_ends_at && organization.subscription_status === 'TRIAL') {
      const now = new Date();
      const trialEnd = new Date(organization.trial_ends_at);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const subscriptionStatus = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        website: organization.website,
        industry: organization.industry,
        subscriptionStatus: organization.subscription_status,
        subscriptionTier: organization.subscription_tier,
        maxSeats: organization.max_seats,
        currentSeats: userCount || 0,
        subscriptionStartedAt: organization.subscription_started_at,
        subscriptionEndsAt: organization.subscription_ends_at,
        trialEndsAt: organization.trial_ends_at,
        trialDaysRemaining,
        hasStripeCustomer: !!organization.stripe_customer_id,
        createdAt: organization.created_at,
      },
      stripe: stripeSubscription ? {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        latestInvoice: stripeSubscription.latest_invoice,
      } : null,
      permissions: {
        canManageBilling: userWithOrg.role === 'OWNER',
        canInviteUsers: ['OWNER', 'ADMIN'].includes(userWithOrg.role),
        canManageContent: ['OWNER', 'ADMIN'].includes(userWithOrg.role),
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