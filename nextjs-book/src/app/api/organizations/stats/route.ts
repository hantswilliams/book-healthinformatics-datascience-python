import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client for server-side authentication
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', authUser.id)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get organization statistics
    const [
      // Books accessible to organization (via BookAccess)
      orgBookAccess,
      // Books created by this organization
      orgCreatedBooks,
      // Total progress records for organization users
      totalProgress
    ] = await Promise.all([
      supabase
        .from('book_access')
        .select(`
          book_id,
          books(id)
        `)
        .eq('organization_id', user.organization_id),
      supabase
        .from('books')
        .select('id')
        .eq('organization_id', user.organization_id),
      supabase
        .from('progress')
        .select(`
          completed,
          time_spent,
          users!inner(organization_id)
        `)
        .eq('users.organization_id', user.organization_id)
    ]);

    // Count active users in organization
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id)
      .eq('is_active', true);

    // Handle data extraction with error checking
    const bookAccessData = orgBookAccess.data || [];
    const createdBooksData = orgCreatedBooks.data || [];
    const progressData = totalProgress.data || [];

    // Calculate unique books (combine BookAccess and organization-created books)
    const bookIds = new Set([
      ...bookAccessData.map((access: any) => access.books?.id).filter(Boolean),
      ...createdBooksData.map((book: any) => book.id)
    ]);

    const totalBooks = bookIds.size;
    
    // Calculate completion statistics
    const completedProgress = progressData.filter((p: any) => p.completed);
    const completionRate = progressData.length > 0 
      ? Math.round((completedProgress.length / progressData.length) * 100)
      : 0;

    // Calculate total time spent (in minutes)
    const totalTimeSpent = progressData.reduce((sum: number, p: any) => sum + (p.time_spent || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalBooks,
        activeUsers,
        completionRate,
        totalProgress: progressData.length,
        completedProgress: completedProgress.length,
        totalTimeSpent, // in minutes
        hasData: progressData.length > 0 // indicates if there's actual progress data
      }
    });

  } catch (error) {
    console.error('Error fetching organization stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization statistics' },
      { status: 500 }
    );
  }
}