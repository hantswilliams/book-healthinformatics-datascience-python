import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createClient } from '@/lib/supabase-server';
import { z } from 'zod';

const schema = z.object({ sectionIds: z.array(z.string()).min(1) });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user || !['OWNER','ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId } = await context.params;
    const supabase = await createClient();

    const body = await request.json();
    const { sectionIds } = schema.parse(body);

    // Fetch chapter and verify belongs to user's org
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select(`
        id,
        title,
        book:books (
          id,
          title,
          organization_id
        )
      `)
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapter || (chapter.book as any)?.organization_id !== user.organization_id) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Get existing sections to validate IDs
    const { data: existingSections, error: sectionsError } = await supabase
      .from('sections')
      .select('id')
      .eq('chapter_id', chapterId);

    if (sectionsError) {
      throw sectionsError;
    }

    const existingIds = new Set((existingSections || []).map(s => s.id));
    if (sectionIds.some(id => !existingIds.has(id))) {
      return NextResponse.json({ error: 'Invalid section ids' }, { status: 400 });
    }

    // Update section orders
    // First, set negative orders to avoid conflicts
    for (let i = 0; i < sectionIds.length; i++) {
      const { error: updateError } = await supabase
        .from('sections')
        .update({ display_order: -(i + 1) })
        .eq('id', sectionIds[i]);
      
      if (updateError) {
        throw updateError;
      }
    }

    // Then set the final positive orders
    for (let i = 0; i < sectionIds.length; i++) {
      const { error: updateError } = await supabase
        .from('sections')
        .update({ display_order: i + 1 })
        .eq('id', sectionIds[i]);
      
      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({ success: true, message: 'Sections reordered' });
  } catch (error) {
    console.error('Reorder sections error:', error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to reorder sections' }, { status: 500 });
  }
}
