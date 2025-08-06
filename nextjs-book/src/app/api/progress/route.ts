import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const progress = await prisma.progress.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        chapter: {
          include: {
            book: true
          }
        }
      },
      orderBy: {
        chapter: {
          order: 'asc'
        }
      }
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { chapterId, completed } = body;

    if (!chapterId) {
      return NextResponse.json(
        { error: 'Chapter ID is required' },
        { status: 400 }
      );
    }

    // Verify the chapter exists and user has access to it
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId
      },
      include: {
        book: {
          include: {
            bookAccess: {
              where: {
                userId: session.user.id
              }
            }
          }
        }
      }
    });

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this book (either through bookAccess or organization)
    const hasAccess = chapter.book.bookAccess.length > 0 || 
                     (chapter.book.organizationId && chapter.book.organizationId === session.user.organizationId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this chapter' },
        { status: 403 }
      );
    }

    // Update or create progress
    const progress = await prisma.progress.upsert({
      where: {
        userId_chapterId: {
          userId: session.user.id,
          chapterId
        }
      },
      update: {
        completed: completed ?? true,
        completedAt: completed ? new Date() : null
      },
      create: {
        user: {
          connect: {
            id: session.user.id
          }
        },
        book: {
          connect: {
            id: chapter.book.id
          }
        },
        chapter: {
          connect: {
            id: chapterId
          }
        },
        completed: completed ?? true,
        completedAt: completed ? new Date() : null
      },
      include: {
        chapter: {
          include: {
            book: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      progress,
      message: `Chapter "${chapter.title}" marked as ${completed ? 'completed' : 'incomplete'}`
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}