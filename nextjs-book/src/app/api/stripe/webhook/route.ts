import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, verifyWebhookSignature } from '@/lib/stripe-server';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

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
  if (!organizationId) {
    console.error('No organization ID in checkout session metadata');
    return;
  }

  try {
    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Update organization with subscription details
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'TRIAL', // Will be updated when subscription becomes active
        subscriptionStartedAt: new Date(subscription.created * 1000),
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      }
    });

    // Log billing event
    await prisma.billingEvent.create({
      data: {
        organizationId,
        eventType: 'SUBSCRIPTION_CREATED',
        stripeEventId: session.id,
        metadata: JSON.stringify({
          subscriptionId: subscription.id,
          checkoutSessionId: session.id
        }),
      }
    });
    
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
    const subscriptionTier = subscription.metadata?.subscriptionTier as 'STARTER' | 'PRO' | 'ENTERPRISE';
    const maxSeats = subscriptionTier === 'STARTER' ? 5 : subscriptionTier === 'PRO' ? 25 : 999;
    
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
        subscriptionTier: subscriptionTier || 'STARTER',
        maxSeats,
        subscriptionStartedAt: new Date(subscription.created * 1000),
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      }
    });

    await prisma.billingEvent.create({
      data: {
        organizationId,
        eventType: 'SUBSCRIPTION_CREATED',
        metadata: JSON.stringify({
          subscriptionId: subscription.id,
          status: subscription.status,
          tier: subscriptionTier
        }),
      }
    });
    
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
    const subscriptionTier = subscription.metadata?.subscriptionTier as 'STARTER' | 'PRO' | 'ENTERPRISE';
    const maxSeats = subscriptionTier === 'STARTER' ? 5 : subscriptionTier === 'PRO' ? 25 : 999;
    
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
    
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionStatus: status,
        subscriptionTier: subscriptionTier || 'STARTER',
        maxSeats,
        subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      }
    });

    await prisma.billingEvent.create({
      data: {
        organizationId,
        eventType: 'SUBSCRIPTION_UPDATED',
        metadata: JSON.stringify({
          subscriptionId: subscription.id,
          status: subscription.status,
          tier: subscriptionTier
        }),
      }
    });
    
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
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscriptionStatus: 'CANCELED',
        subscriptionEndsAt: new Date(subscription.ended_at! * 1000),
      }
    });

    await prisma.billingEvent.create({
      data: {
        organizationId,
        eventType: 'SUBSCRIPTION_CANCELED',
        metadata: JSON.stringify({
          subscriptionId: subscription.id,
          endedAt: subscription.ended_at
        }),
      }
    });
    
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
    // Update organization status to active if it was in trial
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (organization?.subscriptionStatus === 'TRIAL') {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          subscriptionStatus: 'ACTIVE',
        }
      });
    }

    await prisma.billingEvent.create({
      data: {
        organizationId,
        eventType: 'PAYMENT_SUCCEEDED',
        amount: invoice.amount_paid,
        currency: invoice.currency,
        stripeEventId: invoice.id,
        metadata: JSON.stringify({
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          amountPaid: invoice.amount_paid
        }),
      }
    });
    
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
    await prisma.billingEvent.create({
      data: {
        organizationId,
        eventType: 'PAYMENT_FAILED',
        amount: invoice.amount_due,
        currency: invoice.currency,
        stripeEventId: invoice.id,
        metadata: JSON.stringify({
          invoiceId: invoice.id,
          subscriptionId: subscription.id,
          attemptCount: invoice.attempt_count
        }),
      }
    });
    
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}