import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Get specific user's book access within organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = params.id;

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

    // Get all organization books and the user's access to them
    const books = await prisma.book.findMany({
      where: {
        organizationId: session.user.organizationId
      },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        category: true,
        estimatedHours: true
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Get user's specific access to these books
    const userBookAccess = await prisma.bookAccess.findMany({
      where: {
        organizationId: session.user.organizationId,
        userId: userId
      },
      select: {
        bookId: true,
        accessType: true,
        expiresAt: true,
        grantedAt: true
      }
    });

    // Create a map of book access
    const accessMap = userBookAccess.reduce((acc, access) => {
      acc[access.bookId] = access;
      return acc;
    }, {} as Record<string, any>);

    // Combine books with their access status
    const booksWithAccess = books.map(book => ({
      ...book,
      hasAccess: !!accessMap[book.id],
      accessType: accessMap[book.id]?.accessType || null,
      expiresAt: accessMap[book.id]?.expiresAt || null,
      grantedAt: accessMap[book.id]?.grantedAt || null
    }));

    return NextResponse.json({ 
      user: {
        id: targetUser.id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        role: targetUser.role
      },
      books: booksWithAccess 
    });

  } catch (error) {
    console.error('Error fetching user book access:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user book access' },
      { status: 500 }
    );
  }
}

// Grant or revoke book access for a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { bookId, hasAccess, accessType = 'READ' } = body;

    if (!bookId || hasAccess === undefined) {
      return NextResponse.json(
        { error: 'Book ID and access status are required' },
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

    if (hasAccess) {
      // Grant access
      const access = await prisma.bookAccess.upsert({
        where: {
          organizationId_bookId: {
            organizationId: session.user.organizationId,
            bookId
          }
        },
        update: {
          userId,
          accessType,
          grantedBy: session.user.id,
        },
        create: {
          organizationId: session.user.organizationId,
          userId,
          bookId,
          accessType,
          grantedBy: session.user.id,
        }
      });

      return NextResponse.json({ access, granted: true });
    } else {
      // Revoke access
      await prisma.bookAccess.deleteMany({
        where: {
          organizationId: session.user.organizationId,
          userId,
          bookId
        }
      });

      return NextResponse.json({ revoked: true });
    }

  } catch (error) {
    console.error('Error managing user book access:', error);
    return NextResponse.json(
      { error: 'Failed to manage user book access' },
      { status: 500 }
    );
  }
}