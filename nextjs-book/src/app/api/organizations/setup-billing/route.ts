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

    // Only organization owners can setup billing
    if (userWithOrg.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can setup billing' },
        { status: 403 }
      );
    }

    const organization = userWithOrg.organization;

    // If Stripe customer already exists, return it
    if (organization.stripe_customer_id) {
      return NextResponse.json({
        success: true,
        message: 'Billing account already exists',
        data: {
          stripeCustomerId: organization.stripe_customer_id,
          organizationId: organization.id
        }
      });
    }

    // Use the current user as the owner (since we already verified they are OWNER)
    const owner = userWithOrg;

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('_key')) {
      return NextResponse.json({
        error: 'Stripe is not properly configured. Please check your environment variables.',
        details: 'STRIPE_SECRET_KEY is missing or invalid'
      }, { status: 503 });
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: owner.email,
      name: `${owner.first_name || ''} ${owner.last_name}`.trim(),
      metadata: {
        organizationId: organization.id,
        organizationName: organization.name,
        userId: user.id
      }
    });

    // Update organization with Stripe customer ID
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        stripe_customer_id: customer.id
      })
      .eq('id', organization.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Billing account created successfully',
      data: {
        stripeCustomerId: customer.id,
        organizationId: organization.id
      }
    });

  } catch (error) {
    console.error('Setup billing error:', error);
    return NextResponse.json(
      { error: 'Failed to setup billing account' },
      { status: 500 }
    );
  }
}