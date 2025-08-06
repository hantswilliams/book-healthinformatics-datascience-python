import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  industry: z.enum([
    'GENERAL',
    'HEALTHCARE', 
    'FINANCE',
    'TECHNOLOGY',
    'EDUCATION',
    'MANUFACTURING',
    'GOVERNMENT',
    'NON_PROFIT'
  ])
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization owners and admins can update organization settings
    if (!['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only organization owners and admins can update organization settings' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateOrganizationSchema.parse(body);

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Generate slug from name if name is being changed
    let slug = organization.slug;
    if (validatedData.name !== organization.name) {
      const baseSlug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check if slug exists and make it unique if needed
      let counter = 1;
      slug = baseSlug;
      
      while (await prisma.organization.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organization.id },
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description || null,
        website: validatedData.website || null,
        industry: validatedData.industry,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully',
      data: {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        slug: updatedOrganization.slug,
        description: updatedOrganization.description,
        website: updatedOrganization.website,
        industry: updatedOrganization.industry
      }
    });

  } catch (error) {
    console.error('Update organization error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}