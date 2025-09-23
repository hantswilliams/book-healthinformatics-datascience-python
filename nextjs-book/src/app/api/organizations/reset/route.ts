import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';

export async function DELETE(request: NextRequest) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with organization details
    const { data: userWithOrg, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (userError || !userWithOrg || !userWithOrg.organization) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only organization owners can reset the organization
    if (userWithOrg.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can reset the organization' },
        { status: 403 }
      );
    }

    const organization = userWithOrg.organization;

    // Start a transaction to delete all organization data
    // Delete in order: sections -> chapters -> books

    // First, get all books for the organization
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id')
      .eq('organization_id', organization.id);

    if (booksError) {
      throw booksError;
    }

    // Delete all sections for all chapters of all books
    if (books && books.length > 0) {
      const bookIds = books.map(book => book.id);

      // Get all chapters for these books
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('id')
        .in('book_id', bookIds);

      if (chaptersError) {
        throw chaptersError;
      }

      if (chapters && chapters.length > 0) {
        const chapterIds = chapters.map(chapter => chapter.id);

        // Delete all sections
        const { error: sectionsError } = await supabase
          .from('sections')
          .delete()
          .in('chapter_id', chapterIds);

        if (sectionsError) {
          throw sectionsError;
        }

        // Delete all chapters
        const { error: deleteChaptersError } = await supabase
          .from('chapters')
          .delete()
          .in('id', chapterIds);

        if (deleteChaptersError) {
          throw deleteChaptersError;
        }
      }

      // Delete all books
      const { error: deleteBooksError } = await supabase
        .from('books')
        .delete()
        .in('id', bookIds);

      if (deleteBooksError) {
        throw deleteBooksError;
      }
    }

    // Delete other organization-related data
    // Note: Progress records will be automatically deleted via CASCADE when we delete chapters and books
    // But let's be explicit and delete them first to avoid any issues
    if (books && books.length > 0) {
      const bookIds = books.map(book => book.id);

      // Delete progress records for all books in this organization
      const { error: progressError } = await supabase
        .from('progress')
        .delete()
        .in('book_id', bookIds);

      if (progressError) {
        console.error('Error deleting progress:', progressError);
        // Don't throw - this is not critical as CASCADE should handle it
      }
    }

    // Delete code executions
    const { error: codeExecutionsError } = await supabase
      .from('code_executions')
      .delete()
      .eq('organization_id', organization.id);

    if (codeExecutionsError) {
      console.error('Error deleting code executions:', codeExecutionsError);
      // Don't throw - this is not critical
    }

    // Delete invitations
    const { error: invitationsError } = await supabase
      .from('invitations')
      .delete()
      .eq('organization_id', organization.id);

    if (invitationsError) {
      console.error('Error deleting invitations:', invitationsError);
      // Don't throw - this is not critical
    }

    return NextResponse.json({
      success: true,
      message: 'Organization has been reset successfully. All books and chapters have been deleted.'
    });

  } catch (error) {
    console.error('Reset organization error:', error);

    return NextResponse.json(
      { error: 'Failed to reset organization' },
      { status: 500 }
    );
  }
}