import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user using the helper function
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'stats'; // 'stats', 'detailed', 'recent'
    const chapterId = searchParams.get('chapterId');
    const userId = searchParams.get('userId'); 
    const sectionId = searchParams.get('sectionId');
    const status = searchParams.get('status'); // 'success', 'error', 'timeout'
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (view === 'stats') {
      // Return aggregated statistics
      const { data: stats, error: statsError } = await supabase
        .from('admin_code_execution_stats')
        .select('*')
        .eq('organization_id', user.organization_id);

      if (statsError) {
        console.error('Error fetching execution stats:', statsError);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
      }

      // Additional organization-wide stats
      const { data: orgStats, error: orgStatsError } = await supabase
        .from('code_executions')
        .select('execution_status, executed_at')
        .eq('organization_id', user.organization_id);

      if (orgStatsError) {
        console.error('Error fetching org stats:', orgStatsError);
        return NextResponse.json({ error: 'Failed to fetch organization statistics' }, { status: 500 });
      }

      const totalExecutions = orgStats?.length || 0;
      const successfulExecutions = orgStats?.filter(e => e.execution_status === 'success').length || 0;
      const errorExecutions = orgStats?.filter(e => e.execution_status === 'error').length || 0;
      const todayExecutions = orgStats?.filter(e => {
        const today = new Date();
        const executedDate = new Date(e.executed_at);
        return executedDate.toDateString() === today.toDateString();
      }).length || 0;

      return NextResponse.json({
        success: true,
        data: {
          userStats: stats || [],
          organizationStats: {
            totalExecutions,
            successfulExecutions,
            errorExecutions,
            successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
            todayExecutions
          }
        }
      });

    } else {
      // Return detailed execution records
      let query = supabase
        .from('code_executions')
        .select(`
          *,
          users!inner(first_name, last_name, email, username),
          chapters!inner(title)
        `)
        .eq('organization_id', user.organization_id)
        .order('executed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (chapterId) query = query.eq('chapter_id', chapterId);
      if (userId) query = query.eq('user_id', userId);
      if (sectionId) query = query.eq('section_id', sectionId);
      if (status) query = query.eq('execution_status', status);
      if (dateFrom) query = query.gte('executed_at', dateFrom);
      if (dateTo) query = query.lte('executed_at', dateTo);

      const { data: executions, error: queryError } = await query;

      if (queryError) {
        console.error('Error fetching detailed executions:', queryError);
        return NextResponse.json({ error: 'Failed to fetch executions' }, { status: 500 });
      }

      // Transform the data to camelCase for frontend
      const transformedExecutions = (executions || []).map(execution => ({
        id: execution.id,
        userId: execution.user_id,
        organizationId: execution.organization_id,
        chapterId: execution.chapter_id,
        sectionId: execution.section_id,
        codeContent: execution.code_content,
        executionResult: execution.execution_result,
        executionStatus: execution.execution_status,
        errorMessage: execution.error_message,
        executionMode: execution.execution_mode,
        contextId: execution.context_id,
        executedAt: execution.executed_at,
        sessionId: execution.session_id,
        users: execution.users,
        chapters: execution.chapters
      }));

      return NextResponse.json({
        success: true,
        data: transformedExecutions,
        pagination: {
          limit,
          offset,
          hasMore: (executions?.length || 0) === limit
        },
        filters: {
          chapterId,
          userId,
          sectionId, 
          status,
          dateFrom,
          dateTo
        }
      });
    }

  } catch (error) {
    console.error('Admin code executions API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}