import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';

// Get specific user's book access within organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (userError || !currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    // Verify the user belongs to the same organization
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .eq('id', userId)
      .eq('organization_id', currentUser.organization_id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found in your organization' },
        { status: 404 }
      );
    }

    // Get all organization books and the user's access to them
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, title, slug, difficulty, category, estimated_hours')
      .eq('organization_id', currentUser.organization_id)
      .order('display_order', { ascending: true });

    if (booksError) {
      console.error('Error fetching books:', booksError);
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      );
    }

    // Get user's specific access to these books
    const { data: userBookAccess, error: accessError } = await supabase
      .from('book_access')
      .select('book_id, access_type, expires_at, granted_at')
      .eq('organization_id', currentUser.organization_id)
      .eq('user_id', userId);

    if (accessError) {
      console.error('Error fetching book access:', accessError);
      return NextResponse.json(
        { error: 'Failed to fetch book access' },
        { status: 500 }
      );
    }

    // Create a map of book access
    const accessMap = (userBookAccess || []).reduce((acc, access) => {
      acc[access.book_id] = access;
      return acc;
    }, {} as Record<string, any>);

    // Combine books with their access status
    const booksWithAccess = (books || []).map(book => ({
      ...book,
      hasAccess: !!accessMap[book.id],
      accessType: accessMap[book.id]?.access_type || null,
      expiresAt: accessMap[book.id]?.expires_at || null,
      grantedAt: accessMap[book.id]?.granted_at || null
    }));

    return NextResponse.json({ 
      user: {
        id: targetUser.id,
        firstName: targetUser.first_name,
        lastName: targetUser.last_name,
        email: targetUser.email,
        role: targetUser.role
      },
      books: booksWithAccess 
    });

  } catch (error) {
    console.error('Error fetching user book access:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user book access' },
      { status: 500 }
    );
  }
}

// Grant or revoke book access for a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (userError || !currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { bookId, hasAccess, accessType = 'READ' } = body;

    if (!bookId || hasAccess === undefined) {
      return NextResponse.json(
        { error: 'Book ID and access status are required' },
        { status: 400 }
      );
    }

    // Verify the user belongs to the same organization
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('organization_id', currentUser.organization_id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found in your organization' },
        { status: 404 }
      );
    }

    // Verify the book belongs to the organization
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('id', bookId)
      .eq('organization_id', currentUser.organization_id)
      .single();

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found in your organization' },
        { status: 404 }
      );
    }

    if (hasAccess) {
      // Grant access - check if access already exists first
      const { data: existingAccess, error: checkError } = await supabase
        .from('book_access')
        .select('id, user_id')
        .eq('organization_id', currentUser.organization_id)
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing access:', checkError);
        return NextResponse.json(
          { error: 'Failed to check existing access' },
          { status: 500 }
        );
      }

      if (existingAccess) {
        // Update existing access
        const { data: access, error: updateError } = await supabase
          .from('book_access')
          .update({
            access_type: accessType,
            granted_by: currentUser.id,
            granted_at: new Date().toISOString(),
          })
          .eq('id', existingAccess.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating book access:', updateError);
          return NextResponse.json(
            { error: 'Failed to update book access' },
            { status: 500 }
          );
        }

        return NextResponse.json({ access, granted: true });
      } else {
        // Insert new access
        const { data: access, error: insertError } = await supabase
          .from('book_access')
          .insert({
            organization_id: currentUser.organization_id,
            user_id: userId,
            book_id: bookId,
            access_type: accessType,
            granted_by: currentUser.id,
            granted_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting book access:', insertError);
          return NextResponse.json(
            { error: 'Failed to grant book access' },
            { status: 500 }
          );
        }

        return NextResponse.json({ access, granted: true });
      }
    } else {
      // Revoke access
      const { error: deleteError } = await supabase
        .from('book_access')
        .delete()
        .eq('organization_id', currentUser.organization_id)
        .eq('user_id', userId)
        .eq('book_id', bookId);

      if (deleteError) {
        console.error('Error revoking book access:', deleteError);
        return NextResponse.json(
          { error: 'Failed to revoke book access' },
          { status: 500 }
        );
      }

      return NextResponse.json({ revoked: true });
    }

  } catch (error) {
    console.error('Error managing user book access:', error);
    return NextResponse.json(
      { error: 'Failed to manage user book access' },
      { status: 500 }
    );
  }
}