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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // 'csv' or 'json'
    const chapterId = searchParams.get('chapterId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build query for export
    let query = supabase
      .from('code_executions')
      .select(`
        *,
        users!inner(first_name, last_name, email, username),
        chapters!inner(title)
      `)
      .eq('organization_id', user.organization_id)
      .order('executed_at', { ascending: false });

    // Apply filters
    if (chapterId) query = query.eq('chapter_id', chapterId);
    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('execution_status', status);
    if (dateFrom) query = query.gte('executed_at', dateFrom);
    if (dateTo) query = query.lte('executed_at', dateTo);

    const { data: executions, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching executions for export:', queryError);
      return NextResponse.json({ error: 'Failed to fetch execution data' }, { status: 500 });
    }

    if (!executions || executions.length === 0) {
      return NextResponse.json({ error: 'No data available for export' }, { status: 404 });
    }

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = [
        'Execution ID',
        'User Name', 
        'User Email',
        'Chapter Title',
        'Section ID',
        'Execution Mode',
        'Status',
        'Executed At',
        'Code Content',
        'Result',
        'Error Message'
      ].join(',');

      const csvRows = executions.map(execution => [
        execution.id,
        execution.users.first_name ? `"${execution.users.first_name} ${execution.users.last_name}"` : `"${execution.users.username}"`,
        execution.users.email,
        `"${execution.chapters.title}"`,
        execution.section_id,
        execution.execution_mode,
        execution.execution_status,
        new Date(execution.executed_at).toISOString(),
        `"${execution.code_content.replace(/"/g, '""')}"`,
        execution.execution_result ? `"${execution.execution_result.replace(/"/g, '""')}"` : '',
        execution.error_message ? `"${execution.error_message.replace(/"/g, '""')}"` : ''
      ].join(','));

      const csvContent = [csvHeader, ...csvRows].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="code-executions-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });

    } else {
      // Return JSON format
      const jsonData = executions.map(execution => ({
        id: execution.id,
        user: {
          name: execution.users.first_name ? `${execution.users.first_name} ${execution.users.last_name}` : execution.users.username,
          email: execution.users.email,
          username: execution.users.username
        },
        chapter: {
          id: execution.chapter_id,
          title: execution.chapters.title
        },
        section_id: execution.section_id,
        execution_mode: execution.execution_mode,
        context_id: execution.context_id,
        status: execution.execution_status,
        executed_at: execution.executed_at,
        code_content: execution.code_content,
        execution_result: execution.execution_result,
        error_message: execution.error_message,
        session_id: execution.session_id
      }));

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="code-executions-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

  } catch (error) {
    console.error('Code execution export API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}