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

    // Get authenticated user using the helper function
    const { user, error: authError } = await getAuthenticatedUser(orgSlug);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view organization stats
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const supabase = await createClient();

    // Get organization users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id)
      .eq('is_active', true);

    if (usersError) {
      console.error('Error fetching users count:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get active users (logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: activeUsers, error: activeUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id)
      .eq('is_active', true)
      .gte('last_login_at', sevenDaysAgo.toISOString());

    if (activeUsersError) {
      console.error('Error fetching active users:', activeUsersError);
    }

    // Get books accessible to the organization
    const { data: bookAccess, error: bookAccessError } = await supabase
      .from('book_access')
      .select(`
        book_id,
        books:book_id (
          id,
          title
        )
      `)
      .eq('organization_id', user.organization_id);

    if (bookAccessError) {
      console.error('Error fetching book access:', bookAccessError);
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
    }

    // Get unique books
    const uniqueBooks = bookAccess?.reduce((acc, item) => {
      if (item.books && !acc.find(book => book.id === item.books.id)) {
        acc.push(item.books);
      }
      return acc;
    }, [] as any[]) || [];

    // Get total chapters from accessible books
    const bookIds = uniqueBooks.map(book => book.id);
    let totalChapters = 0;
    if (bookIds.length > 0) {
      const { count: chaptersCount, error: chaptersError } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .in('book_id', bookIds);

      if (chaptersError) {
        console.error('Error fetching chapters count:', chaptersError);
      } else {
        totalChapters = chaptersCount || 0;
      }
    }

    // Get progress data for the organization
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select('user_id, completed')
      .eq('organization_id', user.organization_id);

    if (progressError) {
      console.error('Error fetching progress data:', progressError);
    }

    // Calculate completion stats
    const totalProgress = progressData?.length || 0;
    const completedProgress = progressData?.filter(p => p.completed).length || 0;
    const completionRate = totalProgress > 0 ? Math.round((completedProgress / totalProgress) * 100) : 0;

    const organizationStats = {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0
      },
      content: {
        books: uniqueBooks.length,
        chapters: totalChapters
      },
      engagement: {
        totalProgress,
        completedProgress,
        completionRate
      }
    };

    return NextResponse.json({
      success: true,
      data: organizationStats
    });

  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization statistics' },
      { status: 500 }
    );
  }
}