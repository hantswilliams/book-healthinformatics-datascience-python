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

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get organization statistics
    const [
      // Books accessible to organization (via BookAccess)
      orgBookAccess,
      // Books created by this organization
      orgCreatedBooks,
      // Total active users in organization
      activeUsers,
      // Total progress records for organization users
      totalProgress
    ] = await Promise.all([
      prisma.bookAccess.findMany({
        where: { organizationId: user.organizationId },
        include: { book: { select: { id: true } } }
      }),
      prisma.book.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true }
      }),
      prisma.user.count({
        where: {
          organizationId: user.organizationId,
          isActive: true
        }
      }),
      prisma.progress.findMany({
        where: {
          user: {
            organizationId: user.organizationId
          }
        },
        select: {
          completed: true,
          timeSpent: true
        }
      })
    ]);

    // Calculate unique books (combine BookAccess and organization-created books)
    const bookIds = new Set([
      ...orgBookAccess.map(access => access.book.id),
      ...orgCreatedBooks.map(book => book.id)
    ]);

    const totalBooks = bookIds.size;
    
    // Calculate completion statistics
    const completedProgress = totalProgress.filter(p => p.completed);
    const completionRate = totalProgress.length > 0 
      ? Math.round((completedProgress.length / totalProgress.length) * 100)
      : 0;

    // Calculate total time spent (in minutes)
    const totalTimeSpent = totalProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalBooks,
        activeUsers,
        completionRate,
        totalProgress: totalProgress.length,
        completedProgress: completedProgress.length,
        totalTimeSpent, // in minutes
        hasData: totalProgress.length > 0 // indicates if there's actual progress data
      }
    });

  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization statistics' },
      { status: 500 }
    );
  }
}