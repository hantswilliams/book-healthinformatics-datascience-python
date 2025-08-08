import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const reorderSchema = z.object({
  chapterIds: z.array(z.string()).min(1)
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ bookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['OWNER','ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = await context.params;

    const body = await request.json();
    const { chapterIds } = reorderSchema.parse(body);

    // validate book ownership
    const book = await prisma.book.findFirst({
      where: { id: bookId, organizationId: session.user.organizationId },
      select: { id: true }
    });
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    // fetch existing chapters to verify IDs
    const existingChapters = await prisma.chapter.findMany({
      where: { bookId },
      select: { id: true }
    });
    const existingIds = new Set(existingChapters.map(c => c.id));
    if (chapterIds.some(id => !existingIds.has(id))) {
      return NextResponse.json({ error: 'Invalid chapter ids' }, { status: 400 });
    }

    // Two-phase to avoid unique constraint collisions: set temp negative order then final
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < chapterIds.length; i++) {
        await tx.chapter.update({ where: { id: chapterIds[i] }, data: { order: -(i + 1) } });
      }
      for (let i = 0; i < chapterIds.length; i++) {
        await tx.chapter.update({ where: { id: chapterIds[i] }, data: { order: i + 1 } });
      }
    });

    return NextResponse.json({ success: true, message: 'Chapters reordered' });
  } catch (error) {
    console.error('Reorder chapters error:', error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to reorder chapters' }, { status: 500 });
  }
}
