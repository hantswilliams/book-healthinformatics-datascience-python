import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const chapterId = searchParams.get('chapterId');

    const where: { userId?: string; chapterId?: string } = {};
    if (userId) where.userId = userId;
    if (chapterId) where.chapterId = chapterId;

    const exercises = await prisma.exercise.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true
          }
        },
        chapter: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, chapterId, title, code, isCorrect } = body;

    if (!userId || !chapterId || !title || !code) {
      return NextResponse.json(
        { error: 'User ID, Chapter ID, title, and code are required' },
        { status: 400 }
      );
    }

    // Check if this exact exercise already exists for this user
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        userId,
        chapterId,
        title,
        code
      }
    });

    let exercise;
    
    if (existingExercise) {
      // Update attempts count
      exercise = await prisma.exercise.update({
        where: {
          id: existingExercise.id
        },
        data: {
          attempts: existingExercise.attempts + 1,
          isCorrect: isCorrect ?? false
        }
      });
    } else {
      // Create new exercise
      exercise = await prisma.exercise.create({
        data: {
          userId,
          chapterId,
          title,
          code,
          isCorrect: isCorrect ?? false,
          attempts: 1
        }
      });
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Error creating/updating exercise:', error);
    return NextResponse.json(
      { error: 'Failed to save exercise' },
      { status: 500 }
    );
  }
}