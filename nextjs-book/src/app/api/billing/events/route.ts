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

    // Only organization owners can view billing events
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can view billing events' },
        { status: 403 }
      );
    }

    // Get the limit from query parameters (default 20, max 100)
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Get billing events for the organization
    const billingEvents = await prisma.billingEvent.findMany({
      where: {
        organizationId: session.user.organizationId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        eventType: true,
        amount: true,
        currency: true,
        stripeEventId: true,
        metadata: true,
        createdAt: true,
      }
    });

    // Parse metadata for each event
    const formattedEvents = billingEvents.map(event => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : null
    }));

    return NextResponse.json({
      success: true,
      data: formattedEvents
    });

  } catch (error) {
    console.error('Get billing events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing events' },
      { status: 500 }
    );
  }
}