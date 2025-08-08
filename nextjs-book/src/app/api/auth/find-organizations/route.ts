import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const findOrganizationsSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = findOrganizationsSchema.parse(body);

    // Find all users with this email across organizations
    const users = await prisma.user.findMany({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      },
      include: {
        organization: {
          select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
            industry: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No account found with this email address',
        organizations: [],
      });
    }

    // Map to organization data (remove duplicates if user somehow exists multiple times)
    const organizations = users
      .map(user => ({
        id: user.organization.id,
        slug: user.organization.slug,
        name: user.organization.name,
        logo: user.organization.logo,
        industry: user.organization.industry,
        subscriptionStatus: user.organization.subscriptionStatus,
        userRole: user.role,
        userFirstName: user.firstName,
        userLastName: user.lastName,
      }))
      .filter((org, index, self) => 
        index === self.findIndex(o => o.id === org.id)
      );

    return NextResponse.json({
      success: true,
      organizations,
      count: organizations.length,
    });

  } catch (error) {
    console.error('Error finding organizations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email format',
          organizations: [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to find organizations',
        organizations: [],
      },
      { status: 500 }
    );
  }
}