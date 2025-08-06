import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization data
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        organization: {
          id: organization.id,
          name: organization.name,
          stripeCustomerId: organization.stripeCustomerId,
          stripeSubscriptionId: organization.stripeSubscriptionId,
          subscriptionStatus: organization.subscriptionStatus,
          subscriptionTier: organization.subscriptionTier,
          trialEndsAt: organization.trialEndsAt,
          hasStripeCustomer: !!organization.stripeCustomerId
        },
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          organizationId: session.user.organizationId
        },
        users: organization.users
      }
    });

  } catch (error) {
    console.error('Debug organization error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization data' },
      { status: 500 }
    );
  }
}