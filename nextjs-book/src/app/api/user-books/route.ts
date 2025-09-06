import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // Extract organization slug from the referer header (which contains the full URL)
    const referer = request.headers.get('referer');
    let orgSlug: string | undefined = undefined;
    
    if (referer) {
      const urlMatch = referer.match(/\/org\/([^\/]+)/);
      if (urlMatch && urlMatch[1]) {
        orgSlug = urlMatch[1];
      }
    }
    
    // Get authenticated user and organization info with org context
    const { user, error: authError } = await getAuthenticatedUser(orgSlug);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Fetch books based on user role and access permissions
    let books;
    let booksError;
    
    if (['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(user.role)) {
      // Admins, owners, and instructors see all published books in their organization
      const result = await supabase
        .from('books')
        .select(`
          id,
          slug,
          title,
          description,
          difficulty,
          estimated_hours,
          category,
          tags,
          is_published,
          is_public,
          display_order,
          organization_id,
          created_by,
          created_at,
          updated_at,
          chapters (
            id,
            title,
            emoji,
            display_order,
            estimated_minutes,
            is_published
          )
        `)
        .eq('organization_id', user.organization_id)
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      
      books = result.data;
      booksError = result.error;
    } else {
      // Learners only see books they have explicit access to
      // First get the book IDs the user has access to
      const { data: accessData, error: accessError } = await supabase
        .from('book_access')
        .select('book_id')
        .eq('user_id', user.id)
        .eq('organization_id', user.organization_id);

      if (accessError) {
        console.error('Error fetching book access:', accessError);
        return NextResponse.json(
          { error: 'Failed to fetch book access' },
          { status: 500 }
        );
      }

      const accessibleBookIds = (accessData || []).map(access => access.book_id);

      if (accessibleBookIds.length === 0) {
        // User has no book access, return empty array
        books = [];
        booksError = null;
      } else {
        // Fetch only the books the user has access to
        const result = await supabase
          .from('books')
          .select(`
            id,
            slug,
            title,
            description,
            difficulty,
            estimated_hours,
            category,
            tags,
            is_published,
            is_public,
            display_order,
            organization_id,
            created_by,
            created_at,
            updated_at,
            chapters (
              id,
              title,
              emoji,
              display_order,
              estimated_minutes,
              is_published
            )
          `)
          .eq('organization_id', user.organization_id)
          .eq('is_published', true)
          .in('id', accessibleBookIds)
          .order('display_order', { ascending: true });
        
        books = result.data;
        booksError = result.error;
      }
    }


    if (booksError) {
      console.error('Error fetching books:', booksError);
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      );
    }

    // Format the response to match the expected interface
    const formattedBooks = (books || []).map(book => {
      // Determine access type based on user role and book ownership
      let accessType = 'READ'; // Default access
      
      if (book.organization_id === user.organization_id) {
        // User is in the same organization as the book
        if (['OWNER', 'ADMIN'].includes(user.role)) {
          accessType = 'ADMIN'; // Full admin access
        } else if (user.role === 'INSTRUCTOR') {
          accessType = 'WRITE'; // Can edit but not delete
        }
      }
      
      return {
        ...book,
        estimatedHours: book.estimated_hours,
        isPublished: book.is_published,
        isPublic: book.is_public,
        order: book.display_order,
        organizationId: book.organization_id,
        createdBy: book.created_by,
        createdAt: book.created_at,
        updatedAt: book.updated_at,
        accessType, // Add the calculated access type
        chapters: (book.chapters || []).map(chapter => ({
          ...chapter,
          order: chapter.display_order,
          estimatedMinutes: chapter.estimated_minutes,
          isPublished: chapter.is_published
        })),
        tags: book.tags ? JSON.parse(book.tags) : []
      };
    });

    return NextResponse.json({ books: formattedBooks });
  } catch (error) {
    console.error('Error fetching user books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}