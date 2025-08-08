import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    if (!user || !user.organization) {
      return NextResponse.json({ error: 'User or organization not found' }, { status: 404 });
    }

    return NextResponse.json({
      organizationSlug: user.organization.slug,
      organizationName: user.organization.name,
    });
  } catch (error) {
    console.error('Error fetching user organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}