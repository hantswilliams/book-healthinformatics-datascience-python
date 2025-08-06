import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Bulk publish all unpublished books in an organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can bulk publish books' },
        { status: 401 }
      );
    }

    // Update all unpublished books in the organization
    const result = await prisma.book.updateMany({
      where: {
        organizationId: session.user.organizationId,
        isPublished: false
      },
      data: {
        isPublished: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} books published successfully`,
      count: result.count
    });

  } catch (error) {
    console.error('Error bulk publishing books:', error);
    return NextResponse.json(
      { error: 'Failed to bulk publish books' },
      { status: 500 }
    );
  }
}