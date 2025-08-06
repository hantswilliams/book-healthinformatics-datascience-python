import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organization owners can manage team members
    if (session.user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only organization owners can manage team members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isActive, role } = body;

    // Get the user to verify they belong to the same organization
    const targetUser = await prisma.user.findFirst({
      where: {
        id: params.id,
        organizationId: session.user.organizationId
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found or not in your organization' },
        { status: 404 }
      );
    }

    // Prevent owners from deactivating themselves
    if (targetUser.id === session.user.id && isActive === false) {
      return NextResponse.json(
        { error: 'You cannot deactivate yourself' },
        { status: 400 }
      );
    }

    // Prevent changing role of owners
    if (targetUser.role === 'OWNER' && role && role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot change role of organization owner' },
        { status: 400 }
      );
    }

    // Update the user
    const updateData: any = {};
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (role && role !== targetUser.role) {
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        joinedAt: true,
        lastLoginAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser
    });

  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}