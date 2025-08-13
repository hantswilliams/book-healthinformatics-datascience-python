import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // TODO: Implement exercise tracking with Supabase when learning features are needed
    // For now, return empty exercises to prevent errors
    const exercises: any[] = [];

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

    // TODO: Implement exercise tracking with Supabase when learning features are needed
    // For now, return mock exercise to prevent errors
    const exercise = {
      id: `exercise-${Date.now()}`,
      userId,
      chapterId,
      title,
      code,
      isCorrect: isCorrect ?? false,
      attempts: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Error creating/updating exercise:', error);
    return NextResponse.json(
      { error: 'Failed to save exercise' },
      { status: 500 }
    );
  }
}