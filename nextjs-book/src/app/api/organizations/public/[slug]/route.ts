import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const organization = await prisma.organization.findUnique({
      where: { slug },
      select: {
        name: true,
        industry: true,
        logo: true,
        subscriptionStatus: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);

  } catch (error) {
    console.error('Error fetching public organization info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization info' },
      { status: 500 }
    );
  }
}