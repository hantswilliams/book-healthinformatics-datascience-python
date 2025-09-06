import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Extract organization slug from the referer header
    const referer = request.headers.get('referer');
    let orgSlug: string | undefined = undefined;
    
    if (referer) {
      const urlMatch = referer.match(/\/org\/([^\/]+)/);
      if (urlMatch && urlMatch[1]) {
        orgSlug = urlMatch[1];
      }
    }

    const { user, error: authError } = await getAuthenticatedUser(orgSlug);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'stats';
    const chapterId = searchParams.get('chapterId');
    const userId = searchParams.get('userId'); 
    const sectionId = searchParams.get('sectionId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (view === 'stats') {
      // Return aggregated assessment statistics
      const { data: stats, error: statsError } = await supabase
        .from('admin_assessment_stats')
        .select('*')
        .eq('organization_id', user.organization_id);

      if (statsError) {
        console.error('Error fetching assessment stats:', statsError);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
      }

      // Additional organization-wide stats
      const { data: orgStats, error: orgStatsError } = await supabase
        .from('assessment_attempts')
        .select('is_correct, points_earned, max_points, attempted_at')
        .eq('organization_id', user.organization_id);

      if (orgStatsError) {
        console.error('Error fetching org assessment stats:', orgStatsError);
        return NextResponse.json({ error: 'Failed to fetch organization statistics' }, { status: 500 });
      }

      const totalAttempts = orgStats?.length || 0;
      const correctAttempts = orgStats?.filter(a => a.is_correct).length || 0;
      const totalPointsEarned = orgStats?.reduce((sum, a) => sum + a.points_earned, 0) || 0;
      const totalPossiblePoints = orgStats?.reduce((sum, a) => sum + a.max_points, 0) || 0;
      const todayAttempts = orgStats?.filter(a => {
        const today = new Date();
        const attemptDate = new Date(a.attempted_at);
        return attemptDate.toDateString() === today.toDateString();
      }).length || 0;

      // Transform stats to camelCase
      const transformedStats = (stats || []).map(stat => ({
        organizationId: stat.organization_id,
        userId: stat.user_id,
        firstName: stat.first_name,
        lastName: stat.last_name,
        email: stat.email,
        chapterId: stat.chapter_id,
        chapterTitle: stat.chapter_title,
        sectionId: stat.section_id,
        totalAttempts: stat.total_attempts,
        correctAttempts: stat.correct_attempts,
        incorrectAttempts: stat.incorrect_attempts,
        totalPointsEarned: stat.total_points_earned,
        totalPossiblePoints: stat.total_possible_points,
        lastAttempt: stat.last_attempt,
        firstAttempt: stat.first_attempt,
        successPercentage: stat.success_percentage
      }));

      return NextResponse.json({
        success: true,
        data: {
          userStats: transformedStats,
          organizationStats: {
            totalAttempts,
            correctAttempts,
            incorrectAttempts: totalAttempts - correctAttempts,
            totalPointsEarned,
            totalPossiblePoints,
            successRate: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
            scoreRate: totalPossiblePoints > 0 ? Math.round((totalPointsEarned / totalPossiblePoints) * 100) : 0,
            todayAttempts
          }
        }
      });

    } else {
      // Return detailed assessment attempts
      let query = supabase
        .from('assessment_attempts')
        .select(`
          *,
          users!inner(first_name, last_name, email, username),
          chapters!inner(title)
        `)
        .eq('organization_id', user.organization_id)
        .order('attempted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (chapterId) query = query.eq('chapter_id', chapterId);
      if (userId) query = query.eq('user_id', userId);
      if (sectionId) query = query.eq('section_id', sectionId);

      const { data: attempts, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching detailed assessment attempts:', queryError);
        return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
      }

      // Transform the data to camelCase for frontend
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
        attemptedAt: attempt.attempted_at,
        users: attempt.users,
        chapters: attempt.chapters
      }));

      return NextResponse.json({
        success: true,
        data: transformedAttempts,
        pagination: {
          limit,
          offset,
          hasMore: (attempts?.length || 0) === limit
        },
        filters: {
          chapterId,
          userId,
          sectionId
        }
      });
    }

  } catch (error) {
    console.error('Admin assessments API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}