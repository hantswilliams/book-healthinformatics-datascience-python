import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { saveFileContent } from '@/lib/file-storage';
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization owners and admins can create books
    if (!['OWNER', 'ADMIN'].includes(session.user.role)) {
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
    
    while (await prisma.book.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Get the next order for books in this organization
    const lastBook = await prisma.book.findFirst({
      where: { organizationId: session.user.organizationId },
      orderBy: { order: 'desc' }
    });

    const nextOrder = (lastBook?.order || 0) + 1;

    // Create book with chapters in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the book
      const book = await tx.book.create({
        data: {
          slug,
          title: validatedData.title,
          description: validatedData.description || null,
          difficulty: validatedData.difficulty,
          estimatedHours: validatedData.estimatedHours,
          category: validatedData.category,
          tags: JSON.stringify(validatedData.tags),
          organizationId: session.user.organizationId,
          createdBy: session.user.id,
          isPublished: true,
          isPublic: false,
          order: nextOrder
        }
      });

      // Create chapters with sections
      const chapters = await Promise.all(
        validatedData.chapters.map(async (chapterData) => {
          // Generate chapter ID based on book slug and chapter order
          const chapterId = `${slug}-chapter-${chapterData.order}`;
          
          // Calculate estimated reading time based on all sections
          const totalContentLength = chapterData.sections.reduce((sum, section) => sum + section.content.length, 0);
          const estimatedMinutes = Math.max(5, Math.floor(totalContentLength / 200));

          // Create chapter
          const chapter = await tx.chapter.create({
            data: {
              id: chapterId,
              bookId: book.id,
              title: chapterData.title,
              emoji: chapterData.emoji,
              order: chapterData.order,
              markdownUrl: '', // Legacy field - will be empty since we use sections now
              pythonUrl: '',   // Legacy field - will be empty since we use sections now
              isPublished: true,
              estimatedMinutes,
              defaultExecutionMode: chapterData.defaultExecutionMode
            }
          });

          // Create sections for this chapter
          const sections = await Promise.all(
            chapterData.sections.map(async (sectionData) => {
              return tx.section.create({
                data: {
                  chapterId: chapter.id,
                  title: sectionData.title || null,
                  type: sectionData.type,
                  order: sectionData.order,
                  content: sectionData.content,
                  executionMode: sectionData.executionMode,
                  dependsOn: sectionData.dependsOn ? JSON.stringify(sectionData.dependsOn) : null
                }
              });
            })
          );

          return { chapter, sections };
        })
      );

      return { book, chapters };
    });

    return NextResponse.json({
      success: true,
      message: 'Book created successfully',
      data: {
        bookId: result.book.id,
        slug: result.book.slug,
        title: result.book.title,
        chaptersCreated: result.chapters.length
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