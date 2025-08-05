import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const progress = await prisma.progress.findMany({
      where: {
        userId: userId
      },
      include: {
        chapter: true
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
    const body = await request.json();
    const { userId, chapterId, completed } = body;

    if (!userId || !chapterId) {
      return NextResponse.json(
        { error: 'User ID and Chapter ID are required' },
        { status: 400 }
      );
    }

    const progress = await prisma.progress.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId
        }
      },
      update: {
        completed: completed ?? true,
        completedAt: completed ? new Date() : null
      },
      create: {
        userId,
        chapterId,
        completed: completed ?? true,
        completedAt: completed ? new Date() : null
      }
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}