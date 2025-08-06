import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe-server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization with subscription details
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        _count: { select: { users: true } }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    let stripeSubscription = null;
    if (organization.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          organization.stripeSubscriptionId,
          { expand: ['latest_invoice', 'customer'] }
        );
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    // Calculate trial days remaining
    let trialDaysRemaining = 0;
    if (organization.trialEndsAt && organization.subscriptionStatus === 'TRIAL') {
      const now = new Date();
      const trialEnd = new Date(organization.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      trialDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const subscriptionStatus = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        subscriptionStatus: organization.subscriptionStatus,
        subscriptionTier: organization.subscriptionTier,
        maxSeats: organization.maxSeats,
        currentSeats: organization._count.users,
        subscriptionStartedAt: organization.subscriptionStartedAt,
        subscriptionEndsAt: organization.subscriptionEndsAt,
        trialEndsAt: organization.trialEndsAt,
        trialDaysRemaining,
        hasStripeCustomer: !!organization.stripeCustomerId,
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
        canManageBilling: session.user.role === 'OWNER',
        canInviteUsers: ['OWNER', 'ADMIN'].includes(session.user.role),
        canManageContent: ['OWNER', 'ADMIN'].includes(session.user.role),
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