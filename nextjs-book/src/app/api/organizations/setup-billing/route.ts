import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe-server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization owners can setup billing
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can setup billing' },
        { status: 403 }
      );
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        users: {
          where: { role: 'OWNER' },
          select: {
            firstName: true,
            lastName: true,
            email: true
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

    // If Stripe customer already exists, return it
    if (organization.stripeCustomerId) {
      return NextResponse.json({
        success: true,
        message: 'Billing account already exists',
        data: {
          stripeCustomerId: organization.stripeCustomerId,
          organizationId: organization.id
        }
      });
    }

    // Get the organization owner
    const owner = organization.users[0];
    if (!owner) {
      return NextResponse.json(
        { error: 'No organization owner found' },
        { status: 400 }
      );
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: owner.email,
      name: `${owner.firstName || ''} ${owner.lastName}`.trim(),
      metadata: {
        organizationId: organization.id,
        organizationName: organization.name,
        userId: session.user.id
      }
    });

    // Update organization with Stripe customer ID
    await prisma.organization.update({
      where: { id: organization.id },
      data: {
        stripeCustomerId: customer.id
      }
    });

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