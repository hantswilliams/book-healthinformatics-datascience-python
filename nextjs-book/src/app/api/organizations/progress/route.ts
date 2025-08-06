import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view organization progress
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all users in the organization with their progress
    const organizationUsers = await prisma.user.findMany({
      where: {
        organizationId: user.organizationId,
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        joinedAt: true,
        lastLoginAt: true,
        progress: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            },
            chapter: {
              select: {
                id: true,
                title: true,
                emoji: true,
                order: true,
                estimatedMinutes: true
              }
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });

    // Get all books accessible to the organization
    const orgBooks = await prisma.bookAccess.findMany({
      where: {
        organizationId: user.organizationId
      },
      include: {
        book: {
          include: {
            chapters: {
              select: {
                id: true,
                title: true,
                order: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    // Also get books created by this organization
    const orgCreatedBooks = await prisma.book.findMany({
      where: {
        organizationId: user.organizationId
      },
      include: {
        chapters: {
          select: {
            id: true,
            title: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    // Combine all accessible books
    const allBooks = [
      ...orgBooks.map(({ book }) => book),
      ...orgCreatedBooks.filter(book => 
        !orgBooks.some(({ book: accessBook }) => accessBook.id === book.id)
      )
    ];

    // Calculate progress statistics
    const userStats = organizationUsers.map(user => {
      const totalChapters = allBooks.reduce((sum, book) => sum + book.chapters.length, 0);
      const completedChapters = user.progress.filter(p => p.completed).length;
      const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
      
      const totalTimeSpent = user.progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
      
      // Group progress by book
      const bookProgress = allBooks.map(book => {
        const bookChapters = book.chapters;
        const userBookProgress = user.progress.filter(p => 
          bookChapters.some(c => c.id === p.chapter.id)
        );
        const completedBookChapters = userBookProgress.filter(p => p.completed).length;
        const bookProgressPercentage = bookChapters.length > 0 
          ? Math.round((completedBookChapters / bookChapters.length) * 100) 
          : 0;

        return {
          bookId: book.id,
          bookTitle: book.title,
          bookSlug: book.slug,
          totalChapters: bookChapters.length,
          completedChapters: completedBookChapters,
          progressPercentage: bookProgressPercentage,
          lastActivity: userBookProgress.length > 0 
            ? Math.max(...userBookProgress.map(p => new Date(p.updatedAt).getTime()))
            : null
        };
      });

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        joinedAt: user.joinedAt,
        lastLoginAt: user.lastLoginAt,
        totalChapters,
        completedChapters,
        progressPercentage,
        totalTimeSpent, // in minutes
        bookProgress,
        recentActivity: user.progress
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
      };
    });

    // Calculate organization-wide statistics
    const orgStats = {
      totalUsers: organizationUsers.length,
      totalBooks: allBooks.length,
      totalChapters: allBooks.reduce((sum, book) => sum + book.chapters.length, 0),
      averageProgress: userStats.length > 0 
        ? Math.round(userStats.reduce((sum, user) => sum + user.progressPercentage, 0) / userStats.length)
        : 0,
      totalTimeSpent: userStats.reduce((sum, user) => sum + user.totalTimeSpent, 0),
      activeUsers: organizationUsers.filter(user => 
        user.lastLoginAt && 
        new Date(user.lastLoginAt).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Active in last 7 days
      ).length
    };

    return NextResponse.json({
      success: true,
      data: {
        organizationStats: orgStats,
        userProgress: userStats,
        books: allBooks.map(book => ({
          id: book.id,
          title: book.title,
          slug: book.slug,
          totalChapters: book.chapters.length
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching organization progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization progress' },
      { status: 500 }
    );
  }
}