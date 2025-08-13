import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Fetch user's progress from Supabase
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select(`
        id,
        user_id,
        book_id,
        chapter_id,
        completed,
        completed_at,
        time_spent,
        score,
        created_at,
        updated_at,
        chapter:chapters(
          id,
          title,
          emoji,
          book:books(
            id,
            title
          )
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch progress' },
        { status: 500 }
      );
    }

    // Transform progress data to match frontend expectations
    const transformedProgress = (progress || []).map(p => ({
      id: p.id,
      chapterId: p.chapter_id,  // Convert snake_case to camelCase
      completed: p.completed,
      completedAt: p.completed_at  // Convert snake_case to camelCase
    }));


    return NextResponse.json({ progress: transformedProgress });
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
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    const body = await request.json();
    const { chapterId, completed } = body;

    if (!chapterId) {
      return NextResponse.json(
        { error: 'Chapter ID is required' },
        { status: 400 }
      );
    }

    // Get chapter details to find the book_id
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, book_id')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Upsert progress record (insert or update if exists)
    const progressData = {
      user_id: user.id,
      book_id: chapter.book_id,
      chapter_id: chapterId,
      completed: completed ?? true,
      completed_at: completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { data: progressResult, error: progressError } = await supabase
      .from('progress')
      .upsert(progressData, {
        onConflict: 'user_id,chapter_id'
      })
      .select()
      .single();

    if (progressError) {
      console.error('Error updating progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      progress: progressResult,
      message: `Progress updated successfully`
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}