import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE /api/invitations/[id] - Remove a pending invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invitationId = params.id;

    // Get the invitation with organization info
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        organization: {
          include: {
            users: {
              where: { 
                email: session.user.email,
                role: { in: ['OWNER', 'ADMIN'] }
              }
            }
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' }, 
        { status: 404 }
      );
    }

    // Check if user has permission to delete this invitation
    if (invitation.organization.users.length === 0) {
      return NextResponse.json(
        { error: 'You do not have permission to manage invitations for this organization' },
        { status: 403 }
      );
    }

    // Check if invitation has already been accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'Cannot delete an accepted invitation' },
        { status: 400 }
      );
    }

    // Delete the invitation
    await prisma.invitation.delete({
      where: { id: invitationId }
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation removed successfully'
    });

  } catch (error) {
    console.error('Delete invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    );
  }
}