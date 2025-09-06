import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { stripe, getTierConfig } from '@/lib/stripe-server';
import { z } from 'zod';

const checkoutSchema = z.object({
  organizationId: z.string().min(1),
  subscriptionTier: z.enum(['STARTER', 'PRO']),
});

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

    // Only organization owners can manage billing
    if (userWithOrg.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can manage billing' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { organizationId, subscriptionTier } = checkoutSchema.parse(body);

    // Verify user owns this organization
    if (userWithOrg.organization.id !== organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized access to organization' },
        { status: 403 }
      );
    }

    const organization = userWithOrg.organization;

    const tierConfig = getTierConfig(subscriptionTier);

    // Create or retrieve Stripe customer
    let customerId = organization.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userWithOrg.email || user.email!,
        name: `${userWithOrg.first_name || ''} ${userWithOrg.last_name || ''}`.trim() || user.email!,
        metadata: {
          organizationId: organization.id,
          organizationName: organization.name,
          organizationSlug: organization.slug,
        },
      });
      
      customerId = customer.id;
      
      // Update organization with customer ID
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId);

      if (updateError) {
        console.error('Failed to update organization with Stripe customer ID:', updateError);
      }
    }

    // Get the base URL for redirect URLs - prioritize NEXT_PUBLIC_APP_URL for stable production domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/org/${organization.slug}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/org/${organization.slug}/onboarding/payment?orgId=${organizationId}&cancelled=true`,
      subscription_data: {
        metadata: {
          organizationId: organization.id,
          subscriptionTier: subscriptionTier,
        },
        trial_period_days: 14, // 14-day free trial
      },
      metadata: {
        organizationId: organization.id,
        subscriptionTier: subscriptionTier,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });

    // Log billing event
    const { error: billingEventError } = await supabase
      .from('billing_events')
      .insert({
        organization_id: organization.id,
        event_type: 'TRIAL_STARTED',
        amount: tierConfig.amount,
        currency: 'usd',
        metadata: {
          checkoutSessionId: checkoutSession.id,
          subscriptionTier: subscriptionTier,
          trialDays: 30
        },
      });

    if (billingEventError) {
      console.error('Failed to log billing event:', billingEventError);
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      }
    });

  } catch (error) {
    console.error('Checkout session error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}