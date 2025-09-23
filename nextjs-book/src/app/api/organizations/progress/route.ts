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

    const { user: currentUser, error: authError } = await getAuthenticatedUser(orgSlug);
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view organization progress
    if (!['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

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

    // Get ALL books that belong to this organization (for stats calculation)
    const { data: allOrgBooks, error: allBooksError } = await supabase
      .from('books')
      .select('id, title, slug')
      .eq('organization_id', currentUser.organization_id);

    if (allBooksError) {
      console.error('Error fetching organization books:', allBooksError);
      return NextResponse.json(
        { error: 'Failed to fetch organization books' },
        { status: 500 }
      );
    }

    // Get books with access for individual user calculations
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

    // Get unique books accessible to users (for individual progress)
    const accessibleBooks = bookAccessData?.reduce((acc, item) => {
      if (item.books && !acc.find(book => book.id === item.books.id)) {
        acc.push(item.books);
      }
      return acc;
    }, [] as any[]) || [];

    // Get all progress data for the organization books
    const allBookIds = (allOrgBooks || []).map(book => book.id);
    let progressData = [];
    let progressError = null;

    if (allBookIds.length > 0) {
      const result = await supabase
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
        .in('book_id', allBookIds);

      progressData = result.data;
      progressError = result.error;
    }

    if (progressError) {
      console.error('Error fetching progress data:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch progress data' },
        { status: 500 }
      );
    }

    // Get all chapters for ALL books in this organization (for stats)
    // Note: allBookIds was already declared above
    const { data: chaptersData, error: chaptersError } = await supabase
      .from('chapters')
      .select(`
        id,
        book_id,
        title
      `)
      .in('book_id', allBookIds);

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

    // Get total chapters per book (for ALL organization books)
    const bookChapterCounts = (chaptersData || []).reduce((acc, chapter) => {
      acc[chapter.book_id] = (acc[chapter.book_id] || 0) + 1;
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
      
      // Calculate book-specific progress for ALL organization books
      const allBooksProgress = (allOrgBooks || []).map(book => {
        const hasAccess = userBookAccess.includes(book.id);
        const bookChapters = bookChapterCounts[book.id] || 0;
        const userBookProgress = userProgress.filter(p => p.book_id === book.id);
        const completedBookChapters = userBookProgress.filter(p => p.completed).length;
        const bookProgressPercentage = bookChapters > 0 ? Math.round((completedBookChapters / bookChapters) * 100) : 0;
        
        return {
          bookId: book.id,
          bookTitle: book.title,
          bookSlug: book.slug,
          totalChapters: bookChapters,
          completedChapters: completedBookChapters,
          progressPercentage: bookProgressPercentage,
          hasAccess: hasAccess,
          lastActivity: userBookProgress.length > 0 
            ? Math.max(...userBookProgress.map(p => new Date(p.completed_at || p.created_at).getTime()))
            : null
        };
      });

      // Also keep the old accessible-only progress for backward compatibility
      const bookProgress = userBookAccess.map(bookId => {
        const book = accessibleBooks.find(b => b.id === bookId);
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
        bookProgress, // Only accessible books (for table display)
        allBooksProgress, // ALL organization books (for modal display)
        accessibleBooksCount: userBookAccess.length, // Number of books user has access to
        recentActivity: userProgress
          .sort((a, b) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
          .slice(0, 5)
      };
    }) || [];

    // Calculate organization-wide statistics using ALL books and chapters
    const totalChaptersInOrg = Object.values(bookChapterCounts).reduce((sum, count) => sum + count, 0);
    const averageProgress = userStats.length > 0 
      ? Math.round(userStats.reduce((sum, user) => sum + user.progressPercentage, 0) / userStats.length)
      : 0;
    const totalTimeSpent = userStats.reduce((sum, user) => sum + user.totalTimeSpent, 0);

    const orgStats = {
      totalUsers: organizationUsers?.length || 0,
      totalBooks: (allOrgBooks || []).length, // Use ALL organization books
      totalChapters: totalChaptersInOrg, // Use ALL chapters from all books
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
        books: (allOrgBooks || []).map(book => ({
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