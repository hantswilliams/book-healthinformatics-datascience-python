import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { stripe } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
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

    // Only organization owners can sync billing
    if (userWithOrg.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can sync billing' },
        { status: 403 }
      );
    }

    const organization = userWithOrg.organization;

    // If no Stripe subscription ID, nothing to sync
    if (!organization.stripe_subscription_id) {
      return NextResponse.json({
        success: true,
        message: 'No subscription to sync'
      });
    }

    // Fetch current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(organization.stripe_subscription_id);
    
    // Determine subscription tier from Stripe metadata or price
    const subscriptionTier = subscription.metadata?.subscriptionTier as 'STARTER' | 'PRO' | 'ENTERPRISE' || 'PRO';
    
    // Calculate max seats
    const maxSeats = subscriptionTier === 'STARTER' ? 25 : subscriptionTier === 'PRO' ? 500 : 999999;
    
    // Map Stripe status to our enum
    let status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
    switch (subscription.status) {
      case 'trialing':
        status = 'TRIAL';
        break;
      case 'active':
        status = 'ACTIVE';
        break;
      case 'past_due':
        status = 'PAST_DUE';
        break;
      case 'canceled':
      case 'incomplete_expired':
        status = 'CANCELED';
        break;
      case 'unpaid':
        status = 'UNPAID';
        break;
      default:
        status = 'ACTIVE';
    }

    // Update organization with current Stripe data
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_status: status,
        subscription_tier: subscriptionTier,
        max_seats: maxSeats,
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', organization.id);

    if (updateError) {
      console.error('Error syncing organization:', updateError);
      return NextResponse.json(
        { error: 'Failed to sync subscription data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status,
        tier: subscriptionTier,
        maxSeats,
        currentPeriodEnd: subscription.current_period_end,
      }
    });

  } catch (error) {
    console.error('Subscription sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}