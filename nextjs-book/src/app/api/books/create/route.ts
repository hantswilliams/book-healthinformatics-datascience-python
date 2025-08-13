import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { z } from 'zod';

const sectionSchema = z.object({
  title: z.string().optional(),
  type: z.enum(['MARKDOWN', 'PYTHON']),
  content: z.string(),
  order: z.number(),
  executionMode: z.enum(['SHARED', 'ISOLATED', 'INHERIT']).default('INHERIT'),
  dependsOn: z.array(z.string()).optional()
});

const chapterSchema = z.object({
  title: z.string().min(1),
  emoji: z.string(),
  order: z.number(),
  defaultExecutionMode: z.enum(['SHARED', 'ISOLATED']).default('SHARED'),
  sections: z.array(sectionSchema)
});

const createBookSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  category: z.enum([
    'GENERAL',
    'DATA_SCIENCE', 
    'WEB_DEVELOPMENT',
    'MACHINE_LEARNING',
    'HEALTHCARE',
    'FINANCE',
    'GEOSPATIAL',
    'AUTOMATION',
    'API_DEVELOPMENT'
  ]),
  estimatedHours: z.number().min(1).max(100),
  tags: z.array(z.string()),
  chapters: z.array(chapterSchema).min(1)
});

export async function POST(request: NextRequest) {
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

    // Only organization owners and admins can create books
    if (!['OWNER', 'ADMIN'].includes(userWithOrg.role)) {
      return NextResponse.json(
        { error: 'Only organization owners and admins can create books' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createBookSchema.parse(body);

    // Generate unique slug from title
    const baseSlug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check for existing slugs and make unique
    while (true) {
      const { data: existingBook } = await supabase
        .from('books')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (!existingBook) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get the next order for books in this organization
    const { data: lastBook } = await supabase
      .from('books')
      .select('order')
      .eq('organization_id', userWithOrg.organization.id)
      .order('order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastBook?.order || 0) + 1;

    // Create book with chapters and sections using Supabase
    // First create the book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        slug,
        title: validatedData.title,
        description: validatedData.description || null,
        difficulty: validatedData.difficulty,
        estimated_hours: validatedData.estimatedHours,
        category: validatedData.category,
        tags: JSON.stringify(validatedData.tags),
        organization_id: userWithOrg.organization.id,
        created_by: user.id,
        is_published: true,
        is_public: false,
        display_order: nextOrder
      })
      .select()
      .single();

    if (bookError) {
      console.error('Book creation error:', bookError);
      throw new Error(`Failed to create book: ${bookError.message}`);
    }

    // Create chapters with their sections
    const chaptersToCreate = [];
    const sectionsToCreate = [];

    for (const chapterData of validatedData.chapters) {
      const chapterId = crypto.randomUUID();
      
      // Calculate estimated reading time based on all sections
      const totalContentLength = chapterData.sections.reduce(
        (sum, section) => sum + section.content.length, 
        0
      );
      const estimatedMinutes = Math.max(5, Math.floor(totalContentLength / 200));

      chaptersToCreate.push({
        id: chapterId,
        book_id: book.id,
        title: chapterData.title,
        emoji: chapterData.emoji,
        display_order: chapterData.order,
        markdown_url: '', // Legacy field - empty for new enhanced chapters
        python_url: '',   // Legacy field - empty for new enhanced chapters
        is_published: true,
        estimated_minutes: estimatedMinutes,
        default_execution_mode: chapterData.defaultExecutionMode
      });

      // Create sections for this chapter
      for (const sectionData of chapterData.sections) {
        sectionsToCreate.push({
          id: crypto.randomUUID(),
          chapter_id: chapterId,
          title: sectionData.title || null,
          type: sectionData.type,
          content: sectionData.content,
          display_order: sectionData.order,
          execution_mode: sectionData.executionMode,
          depends_on: sectionData.dependsOn ? JSON.stringify(sectionData.dependsOn) : null
        });
      }
    }

    // Insert chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .insert(chaptersToCreate)
      .select();

    if (chaptersError) {
      console.error('Chapters creation error:', chaptersError);
      throw new Error(`Failed to create chapters: ${chaptersError.message}`);
    }

    // Insert sections
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .insert(sectionsToCreate)
      .select();

    if (sectionsError) {
      console.error('Sections creation error:', sectionsError);
      throw new Error(`Failed to create sections: ${sectionsError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Book created successfully',
      data: {
        bookId: book.id,
        slug: book.slug,
        title: book.title,
        chaptersCreated: chapters.length,
        sectionsCreated: sections.length
      }
    });

  } catch (error) {
    console.error('Create book error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create book' },
      { status: 500 }
    );
  }
}