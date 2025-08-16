import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current user's details from database
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, organization_id')
      .eq('id', authUser.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view organization progress
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all users in the organization
    const { data: organizationUsers, error: orgUsersError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        role,
        joined_at,
        last_login_at
      `)
      .eq('organization_id', currentUser.organization_id)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (orgUsersError) {
      console.error('Error fetching organization users:', orgUsersError);
      return NextResponse.json(
        { error: 'Failed to fetch organization users' },
        { status: 500 }
      );
    }

    // Get books with access count for the organization
    const { data: bookAccessData, error: bookAccessError } = await supabase
      .from('book_access')
      .select(`
        book_id,
        books:book_id (
          id,
          title,
          slug
        )
      `)
      .eq('organization_id', currentUser.organization_id);

    if (bookAccessError) {
      console.error('Error fetching book access:', bookAccessError);
      return NextResponse.json(
        { error: 'Failed to fetch accessible books' },
        { status: 500 }
      );
    }

    // Get unique books accessible to the organization
    const uniqueBooks = bookAccessData?.reduce((acc, item) => {
      if (item.books && !acc.find(book => book.id === item.books.id)) {
        acc.push(item.books);
      }
      return acc;
    }, [] as any[]) || [];

    // Get all progress data for the organization
    const { data: progressData, error: progressError } = await supabase
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
        chapters:chapter_id (
          id,
          title,
          book_id
        ),
        books:book_id (
          id,
          title,
          slug
        )
      `)
      .eq('books.organization_id', currentUser.organization_id);

    if (progressError) {
      console.error('Error fetching progress data:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch progress data' },
        { status: 500 }
      );
    }

    // Get all chapters for books in this organization to calculate totals
    const { data: chaptersData, error: chaptersError } = await supabase
      .from('chapters')
      .select(`
        id,
        book_id,
        title,
        books:book_id (
          id,
          title,
          organization_id
        )
      `)
      .eq('books.organization_id', currentUser.organization_id);

    if (chaptersError) {
      console.error('Error fetching chapters data:', chaptersError);
      return NextResponse.json(
        { error: 'Failed to fetch chapters data' },
        { status: 500 }
      );
    }

    // Create progress maps for calculations
    const userProgressMap = (progressData || []).reduce((acc, progress) => {
      if (!acc[progress.user_id]) {
        acc[progress.user_id] = [];
      }
      acc[progress.user_id].push(progress);
      return acc;
    }, {} as Record<string, any[]>);

    // Get total chapters per book
    const bookChapterCounts = (chaptersData || []).reduce((acc, chapter) => {
      if (chapter.books) {
        acc[chapter.book_id] = (acc[chapter.book_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate total chapters across all accessible books for each user
    const { data: courseCounts, error: courseCountError } = await supabase
      .from('book_access')
      .select('user_id, book_id')
      .eq('organization_id', currentUser.organization_id);

    if (courseCountError) {
      console.error('Error fetching course counts:', courseCountError);
      return NextResponse.json(
        { error: 'Failed to fetch course counts' },
        { status: 500 }
      );
    }

    // Calculate user access to books and their chapters
    const userBookAccessMap = (courseCounts || []).reduce((acc, access) => {
      if (!acc[access.user_id]) {
        acc[access.user_id] = [];
      }
      acc[access.user_id].push(access.book_id);
      return acc;
    }, {} as Record<string, string[]>);

    // Format user data with real progress calculations
    const userStats = organizationUsers?.map(user => {
      const userProgress = userProgressMap[user.id] || [];
      const userBookAccess = userBookAccessMap[user.id] || [];
      
      // Calculate total chapters available to this user
      const totalChapters = userBookAccess.reduce((sum, bookId) => {
        return sum + (bookChapterCounts[bookId] || 0);
      }, 0);
      
      // Calculate completed chapters
      const completedChapters = userProgress.filter(p => p.completed).length;
      
      // Calculate progress percentage
      const progressPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
      
      // Calculate total time spent
      const totalTimeSpent = userProgress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
      
      // Calculate book-specific progress
      const bookProgress = userBookAccess.map(bookId => {
        const book = uniqueBooks.find(b => b.id === bookId);
        const bookChapters = bookChapterCounts[bookId] || 0;
        const userBookProgress = userProgress.filter(p => p.book_id === bookId);
        const completedBookChapters = userBookProgress.filter(p => p.completed).length;
        const bookProgressPercentage = bookChapters > 0 ? Math.round((completedBookChapters / bookChapters) * 100) : 0;
        
        return {
          bookId,
          bookTitle: book?.title || 'Unknown',
          bookSlug: book?.slug || 'unknown',
          totalChapters: bookChapters,
          completedChapters: completedBookChapters,
          progressPercentage: bookProgressPercentage,
          lastActivity: userBookProgress.length > 0 
            ? Math.max(...userBookProgress.map(p => new Date(p.completed_at || p.created_at).getTime()))
            : null
        };
      });

      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        joinedAt: user.joined_at,
        lastLoginAt: user.last_login_at,
        totalChapters,
        completedChapters,
        progressPercentage,
        totalTimeSpent,
        bookProgress,
        recentActivity: userProgress
          .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
          .slice(0, 5)
      };
    }) || [];

    // Calculate organization-wide statistics
    const totalChaptersInOrg = Object.values(bookChapterCounts).reduce((sum, count) => sum + count, 0);
    const averageProgress = userStats.length > 0 
      ? Math.round(userStats.reduce((sum, user) => sum + user.progressPercentage, 0) / userStats.length)
      : 0;
    const totalTimeSpent = userStats.reduce((sum, user) => sum + user.totalTimeSpent, 0);

    const orgStats = {
      totalUsers: organizationUsers?.length || 0,
      totalBooks: uniqueBooks.length,
      totalChapters: totalChaptersInOrg,
      averageProgress,
      totalTimeSpent,
      activeUsers: organizationUsers?.filter(user => 
        user.last_login_at && 
        new Date(user.last_login_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Active in last 7 days
      ).length || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        organizationStats: orgStats,
        userProgress: userStats,
        books: uniqueBooks.map(book => ({
          id: book.id,
          title: book.title,
          slug: book.slug,
          totalChapters: bookChapterCounts[book.id] || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching organization progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization progress' },
      { status: 500 }
    );
  }
}