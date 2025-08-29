import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { chapterId } = await params;
    
    // Get chapter packages with full package details
    const { data: chapterPackages, error } = await supabase
      .from('chapter_packages_with_details')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('load_order');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chapter packages' },
        { status: 500 }
      );
    }

    // Parse tags JSON for each package
    const packagesWithTags = chapterPackages?.map(pkg => ({
      ...pkg,
      tags: pkg.tags ? JSON.parse(pkg.tags) : []
    })) || [];

    return NextResponse.json({ packages: packagesWithTags });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { chapterId } = await params;
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can edit this chapter
    const { data: chapter } = await supabase
      .from('chapters')
      .select(`
        id,
        books!inner(
          id,
          organization_id,
          users!inner(id, role)
        )
      `)
      .eq('id', chapterId)
      .eq('books.users.id', user.id)
      .single();

    if (!chapter || !['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(chapter.books.users.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { packages } = await request.json();

    // Delete existing packages for this chapter
    await supabase
      .from('chapter_packages')
      .delete()
      .eq('chapter_id', chapterId);

    // Insert new packages
    if (packages && packages.length > 0) {
      const packageInserts = packages.map((pkg: any) => ({
        chapter_id: chapterId,
        package_id: pkg.package_id,
        required: pkg.required,
        load_order: pkg.load_order,
        custom_import_name: pkg.custom_import_name,
        pre_import_code: pkg.pre_import_code,
        notes: pkg.notes
      }));

      const { error: insertError } = await supabase
        .from('chapter_packages')
        .insert(packageInserts);

      if (insertError) {
        console.error('Database error:', insertError);
        return NextResponse.json(
          { error: 'Failed to save chapter packages' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { chapterId } = await params;
    
    // Check authentication and permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can edit this chapter
    const { data: chapter } = await supabase
      .from('chapters')
      .select(`
        id,
        books!inner(
          id,
          organization_id,
          users!inner(id, role)
        )
      `)
      .eq('id', chapterId)
      .eq('books.users.id', user.id)
      .single();

    if (!chapter || !['OWNER', 'ADMIN', 'INSTRUCTOR'].includes(chapter.books.users.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete all packages for this chapter
    const { error } = await supabase
      .from('chapter_packages')
      .delete()
      .eq('chapter_id', chapterId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete chapter packages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}