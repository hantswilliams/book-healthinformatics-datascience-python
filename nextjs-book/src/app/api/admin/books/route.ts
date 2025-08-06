import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const books = await prisma.book.findMany({
      include: {
        chapters: {
          select: {
            id: true,
            title: true,
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            bookAccess: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, slug, description, difficulty, estimatedHours, isPublished } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Get next order number
    const lastBook = await prisma.book.findFirst({
      orderBy: { order: 'desc' }
    });
    const nextOrder = (lastBook?.order || 0) + 1;

    const book = await prisma.book.create({
      data: {
        title,
        slug,
        description,
        difficulty: difficulty || 'BEGINNER',
        estimatedHours,
        isPublished: isPublished || false,
        order: nextOrder,
      },
      include: {
        chapters: {
          select: {
            id: true,
            title: true,
          }
        },
        _count: {
          select: {
            bookAccess: true
          }
        }
      }
    });

    return NextResponse.json({ book });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    );
  }
}