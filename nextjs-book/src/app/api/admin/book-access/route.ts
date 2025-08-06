import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all book access for the user's organization
    const bookAccess = await prisma.bookAccess.findMany({
      where: {
        organizationId: session.user.organizationId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        }
      },
      orderBy: {
        grantedAt: 'desc'
      }
    });

    return NextResponse.json({ bookAccess });
  } catch (error) {
    console.error('Error fetching book access:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book access' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, bookId, accessType, expiresAt } = body;

    if (!userId || !bookId) {
      return NextResponse.json(
        { error: 'User ID and Book ID are required' },
        { status: 400 }
      );
    }

    // Verify the user belongs to the same organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: session.user.organizationId
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found in your organization' },
        { status: 404 }
      );
    }

    // Verify the book belongs to the organization
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        organizationId: session.user.organizationId
      }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found in your organization' },
        { status: 404 }
      );
    }

    const access = await prisma.bookAccess.upsert({
      where: {
        organizationId_bookId: {
          organizationId: session.user.organizationId,
          bookId
        }
      },
      update: {
        accessType: accessType || 'READ',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedBy: session.user.id,
      },
      create: {
        organizationId: session.user.organizationId,
        userId,
        bookId,
        accessType: accessType || 'READ',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedBy: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        }
      }
    });

    return NextResponse.json({ access });
  } catch (error) {
    console.error('Error managing book access:', error);
    return NextResponse.json(
      { error: 'Failed to manage book access' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const accessId = searchParams.get('id');

    if (!accessId) {
      return NextResponse.json(
        { error: 'Access ID is required' },
        { status: 400 }
      );
    }

    await prisma.bookAccess.delete({
      where: { id: accessId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting book access:', error);
    return NextResponse.json(
      { error: 'Failed to delete book access' },
      { status: 500 }
    );
  }
}