import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({ sectionIds: z.array(z.string()).min(1) });

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['OWNER','ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId } = await context.params;

    const body = await request.json();
    const { sectionIds } = schema.parse(body);

    // Fetch chapter and verify belongs to org
    const chapter = await prisma.chapter.findFirst({
      where: { id: chapterId },
      include: { book: true }
    });
    if (!chapter || chapter.book.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const existingSections = await prisma.section.findMany({
      where: { chapterId },
      select: { id: true }
    });
    const existingIds = new Set(existingSections.map(s => s.id));
    if (sectionIds.some(id => !existingIds.has(id))) {
      return NextResponse.json({ error: 'Invalid section ids' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < sectionIds.length; i++) {
        await tx.section.update({ where: { id: sectionIds[i] }, data: { order: -(i + 1) } });
      }
      for (let i = 0; i < sectionIds.length; i++) {
        await tx.section.update({ where: { id: sectionIds[i] }, data: { order: i + 1 } });
      }
    });

    return NextResponse.json({ success: true, message: 'Sections reordered' });
  } catch (error) {
    console.error('Reorder sections error:', error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to reorder sections' }, { status: 500 });
  }
}
