import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, verifyWebhookSignature } from '@/lib/stripe-server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase-types';
import Stripe from 'stripe';

// Create Supabase client for webhook use (service key for admin access)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing webhook event:', event.type, 'ID:', event.id);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);
  
  const organizationId = session.metadata?.organizationId;
  const subscriptionTier = session.metadata?.subscriptionTier as 'STARTER' | 'PRO';
  
  if (!organizationId) {
    console.error('No organization ID in checkout session metadata');
    return;
  }

  try {
    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Calculate max seats based on tier
    const maxSeats = subscriptionTier === 'STARTER' ? 25 : 500;
    
    // Update organization with subscription details
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
        subscription_tier: subscriptionTier || 'PRO', // Default to PRO since checkout was for paid plan
        max_seats: maxSeats,
        subscription_started_at: new Date(subscription.created * 1000).toISOString(),
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization:', updateError);
    }

    // Log billing event
    const { error: billingError } = await supabase
      .from('billing_events')
      .insert({
        organization_id: organizationId,
        event_type: 'SUBSCRIPTION_CREATED',
        stripe_event_id: session.id,
        metadata: {
          subscriptionId: subscription.id,
          checkoutSessionId: session.id,
          tier: subscriptionTier
        },
      });

    if (billingError) {
      console.error('Error creating billing event:', billingError);
    }
    
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) {
    console.error('No organization ID in subscription metadata');
    return;
  }

  try {
    const subscriptionTier = subscription.metadata?.subscriptionTier as 'STARTER' | 'PRO';
    const maxSeats = subscriptionTier === 'STARTER' ? 25 : 500;
    
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
        subscription_tier: subscriptionTier || 'STARTER',
        max_seats: maxSeats,
        subscription_started_at: new Date(subscription.created * 1000).toISOString(),
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization:', updateError);
    }

    const { error: billingError } = await supabase
      .from('billing_events')
      .insert({
        organization_id: organizationId,
        event_type: 'SUBSCRIPTION_CREATED',
        metadata: {
          subscriptionId: subscription.id,
          status: subscription.status,
          tier: subscriptionTier
        },
      });

    if (billingError) {
      console.error('Error creating billing event:', billingError);
    }
    
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) {
    console.error('No organization ID in subscription metadata');
    return;
  }

  try {
    const subscriptionTier = subscription.metadata?.subscriptionTier as 'STARTER' | 'PRO';
    const maxSeats = subscriptionTier === 'STARTER' ? 25 : 500;
    
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
    
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_status: status,
        subscription_tier: subscriptionTier || 'STARTER',
        max_seats: maxSeats,
        subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization:', updateError);
    }

    const { error: billingError } = await supabase
      .from('billing_events')
      .insert({
        organization_id: organizationId,
        event_type: 'SUBSCRIPTION_UPDATED',
        metadata: {
          subscriptionId: subscription.id,
          status: subscription.status,
          tier: subscriptionTier
        },
      });

    if (billingError) {
      console.error('Error creating billing event:', billingError);
    }
    
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const organizationId = subscription.metadata?.organizationId;
  if (!organizationId) {
    console.error('No organization ID in subscription metadata');
    return;
  }

  try {
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        subscription_status: 'CANCELED',
        subscription_ends_at: new Date(subscription.ended_at! * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization:', updateError);
    }

    const { error: billingError } = await supabase
      .from('billing_events')
      .insert({
        organization_id: organizationId,
        event_type: 'SUBSCRIPTION_CANCELED',
        metadata: {
          subscriptionId: subscription.id,
          endedAt: subscription.ended_at
        },
      });

    if (billingError) {
      console.error('Error creating billing event:', billingError);
    }
    
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  if (!invoice.subscription) return;
  
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const organizationId = subscription.metadata?.organizationId;
  
  if (!organizationId) {
    console.error('No organization ID in subscription metadata');
    return;
  }

  try {
    // Get current organization status
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_status')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
    }

    // Update organization status to active if it was in trial
    if (organization?.subscription_status === 'TRIAL') {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          subscription_status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);

      if (updateError) {
        console.error('Error updating organization status:', updateError);
      }
    }

    const { error: billingError } = await supabase
      .from('billing_events')
      .insert({
        organization_id: organizationId,
        event_type: 'PAYMENT_SUCCEEDED',
        amount: invoice.amount_paid,
        currency: invoice.currency,
        stripe_event_id: invoice.id,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          amountPaid: invoice.amount_paid
        },
      });

    if (billingError) {
      console.error('Error creating billing event:', billingError);
    }
    
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);
  
  if (!invoice.subscription) return;
  
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  const organizationId = subscription.metadata?.organizationId;
  
  if (!organizationId) {
    console.error('No organization ID in subscription metadata');
    return;
  }

  try {
    const { error: billingError } = await supabase
      .from('billing_events')
      .insert({
        organization_id: organizationId,
        event_type: 'PAYMENT_FAILED',
        amount: invoice.amount_due,
        currency: invoice.currency,
        stripe_event_id: invoice.id,
        metadata: {
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          attemptCount: invoice.attempt_count
        },
      });

    if (billingError) {
      console.error('Error creating billing event:', billingError);
    }
    
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}