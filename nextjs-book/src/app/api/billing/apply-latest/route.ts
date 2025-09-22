import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';

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

    const organization = userWithOrg.organization;

    // Get the latest billing event for this organization
    const { data: latestEvent, error: eventError } = await supabase
      .from('billing_events')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (eventError || !latestEvent) {
      return NextResponse.json({ error: 'No billing events found' }, { status: 404 });
    }

    console.log('📋 Latest billing event:', latestEvent);

    // Parse metadata
    const metadata = typeof latestEvent.metadata === 'string' 
      ? JSON.parse(latestEvent.metadata) 
      : latestEvent.metadata;

    console.log('📋 Parsed metadata:', metadata);

    // Determine tier and seats from billing event
    const subscriptionTier = metadata?.subscriptionTier as 'STARTER' | 'PRO' || 'STARTER';
    const maxSeats = subscriptionTier === 'STARTER' ? 25 : 500;

    console.log('📊 Applying tier:', subscriptionTier, 'with seats:', maxSeats);

    // Determine subscription status based on billing events
    let subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' = 'TRIAL';

    // Check for payment success events to determine if billing is active
    const { data: paymentEvents, error: paymentError } = await supabase
      .from('billing_events')
      .select('*')
      .eq('organization_id', organization.id)
      .in('event_type', ['PAYMENT_SUCCEEDED', 'SUBSCRIPTION_CREATED'])
      .order('created_at', { ascending: false });

    if (!paymentError && paymentEvents && paymentEvents.length > 0) {
      // If we have successful payments or active subscriptions, set to ACTIVE
      const hasSuccessfulPayment = paymentEvents.some(event =>
        event.event_type === 'PAYMENT_SUCCEEDED' ||
        (event.event_type === 'SUBSCRIPTION_CREATED' && metadata?.status === 'active')
      );

      if (hasSuccessfulPayment) {
        subscriptionStatus = 'ACTIVE';
      }
    }

    console.log('📊 Determined subscription status:', subscriptionStatus);

    // Update organization based on latest billing event
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_tier: subscriptionTier,
        max_seats: maxSeats,
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organization.id);

    if (updateError) {
      console.error('Error updating organization:', updateError);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        tier: subscriptionTier,
        maxSeats,
        status: subscriptionStatus,
        eventType: latestEvent.event_type,
        appliedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Apply billing event error:', error);
    return NextResponse.json({ error: 'Failed to apply billing event' }, { status: 500 });
  }
}