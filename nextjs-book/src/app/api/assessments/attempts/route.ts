import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';
import type { AssessmentConfig } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const sectionId = searchParams.get('sectionId');

    if (!chapterId || !sectionId) {
      return NextResponse.json({ error: 'Chapter ID and Section ID are required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: attempts, error } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('chapter_id', chapterId)
      .eq('section_id', sectionId)
      .order('attempted_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessment attempts:', error);
      return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
    }

    // Transform to camelCase
    const transformedAttempts = (attempts || []).map(attempt => ({
      id: attempt.id,
      userId: attempt.user_id,
      organizationId: attempt.organization_id,
      chapterId: attempt.chapter_id,
      sectionId: attempt.section_id,
      userAnswer: attempt.user_answer,
      isCorrect: attempt.is_correct,
      pointsEarned: attempt.points_earned,
      maxPoints: attempt.max_points,
      attemptNumber: attempt.attempt_number,
      attemptedAt: attempt.attempted_at
    }));

    return NextResponse.json({
      success: true,
      attempts: transformedAttempts
    });

  } catch (error) {
    console.error('Assessment attempts API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId, sectionId, userAnswer, assessmentConfig } = await request.json();

    if (!chapterId || !sectionId || userAnswer === undefined || !assessmentConfig) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get current attempt count for this user/section
    const { data: existingAttempts, error: countError } = await supabase
      .from('assessment_attempts')
      .select('attempt_number')
      .eq('user_id', user.id)
      .eq('chapter_id', chapterId)
      .eq('section_id', sectionId)
      .order('attempt_number', { ascending: false })
      .limit(1);

    if (countError) {
      console.error('Error counting attempts:', countError);
      return NextResponse.json({ error: 'Failed to validate attempts' }, { status: 500 });
    }

    const nextAttemptNumber = (existingAttempts?.[0]?.attempt_number || 0) + 1;

    // Check if retries are allowed
    const config = assessmentConfig as AssessmentConfig;
    if (config.allowRetries === false && existingAttempts && existingAttempts.length > 0) {
      return NextResponse.json({ error: 'No retries allowed for this assessment' }, { status: 403 });
    }
    if (typeof config.allowRetries === 'number' && existingAttempts && existingAttempts.length >= config.allowRetries) {
      return NextResponse.json({ error: 'Maximum attempts exceeded' }, { status: 403 });
    }

    // Validate answer and calculate score
    const { isCorrect, pointsEarned } = validateAnswer(userAnswer, config);

    // Insert the attempt
    const { data: attempt, error: insertError } = await supabase
      .from('assessment_attempts')
      .insert({
        user_id: user.id,
        organization_id: user.organization_id,
        chapter_id: chapterId,
        section_id: sectionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        max_points: config.points,
        attempt_number: nextAttemptNumber
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting assessment attempt:', insertError);
      return NextResponse.json({ error: 'Failed to save attempt' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      pointsEarned,
      maxPoints: config.points,
      attemptNumber: nextAttemptNumber
    });

  } catch (error) {
    console.error('Assessment submission API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function validateAnswer(userAnswer: any, config: AssessmentConfig): { isCorrect: boolean; pointsEarned: number } {
  const { questionType, correctAnswer, partialCredit, caseSensitive, points } = config;

  switch (questionType) {
    case 'multiple_choice':
      if (partialCredit && Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
        // Partial credit for multi-select
        const correctCount = userAnswer.filter(answer => correctAnswer.includes(answer)).length;
        const incorrectCount = userAnswer.filter(answer => !correctAnswer.includes(answer)).length;
        const score = Math.max(0, correctCount - incorrectCount);
        const maxScore = correctAnswer.length;
        const pointsEarned = Math.round((score / maxScore) * points);
        return {
          isCorrect: score === maxScore && incorrectCount === 0,
          pointsEarned
        };
      } else {
        // Single correct answer
        const isCorrect = userAnswer === correctAnswer;
        return {
          isCorrect,
          pointsEarned: isCorrect ? points : 0
        };
      }

    case 'true_false':
      const isCorrect = userAnswer === correctAnswer;
      return {
        isCorrect,
        pointsEarned: isCorrect ? points : 0
      };

    case 'short_answer':
      const userText = String(userAnswer).trim();
      const correctText = String(correctAnswer).trim();
      const matches = caseSensitive 
        ? userText === correctText
        : userText.toLowerCase() === correctText.toLowerCase();
      return {
        isCorrect: matches,
        pointsEarned: matches ? points : 0
      };

    default:
      return { isCorrect: false, pointsEarned: 0 };
  }
}