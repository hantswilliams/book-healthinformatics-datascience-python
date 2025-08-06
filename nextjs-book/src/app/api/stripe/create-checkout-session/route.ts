import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe, getTierConfig } from '@/lib/stripe-server';
import { z } from 'zod';

const checkoutSchema = z.object({
  organizationId: z.string().min(1),
  subscriptionTier: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization owners can manage billing
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can manage billing' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { organizationId, subscriptionTier } = checkoutSchema.parse(body);

    // Verify user owns this organization
    if (session.user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized access to organization' },
        { status: 403 }
      );
    }

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          where: { role: 'OWNER' },
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const owner = organization.users[0];
    if (!owner) {
      return NextResponse.json(
        { error: 'Organization owner not found' },
        { status: 404 }
      );
    }

    const tierConfig = getTierConfig(subscriptionTier);

    // Create or retrieve Stripe customer
    let customerId = organization.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: owner.email,
        name: `${owner.firstName} ${owner.lastName}`,
        metadata: {
          organizationId: organization.id,
          organizationName: organization.name,
          organizationSlug: organization.slug,
        },
      });
      
      customerId = customer.id;
      
      // Update organization with customer ID
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeCustomerId: customerId }
      });
    }

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
      success_url: `${process.env.NEXTAUTH_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/onboarding/payment?orgId=${organizationId}&cancelled=true`,
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
    await prisma.billingEvent.create({
      data: {
        organizationId: organization.id,
        eventType: 'TRIAL_STARTED',
        amount: tierConfig.amount,
        currency: 'usd',
        metadata: JSON.stringify({
          checkoutSessionId: checkoutSession.id,
          subscriptionTier: subscriptionTier,
          trialDays: 14
        }),
      }
    });

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