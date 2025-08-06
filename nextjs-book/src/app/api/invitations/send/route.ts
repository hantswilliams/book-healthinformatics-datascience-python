import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { createInvitationEmail } from '@/lib/email-templates';
import { z } from 'zod';
import crypto from 'crypto';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'INSTRUCTOR', 'LEARNER']).default('LEARNER'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user can send invitations (OWNER or ADMIN)
    if (!['OWNER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);

    // Get user's organization with current user count
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      include: {
        users: { select: { id: true } },
        _count: { select: { users: true } }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organization has reached seat limit
    if (organization._count.users >= organization.maxSeats) {
      return NextResponse.json(
        { error: `Seat limit reached. Your plan allows ${organization.maxSeats} users.` },
        { status: 400 }
      );
    }

    // Check if user is already a member of this organization
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser && existingUser.organizationId === session.user.organizationId) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    if (existingUser && existingUser.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'User is already a member of another organization' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findUnique({
      where: {
        email_organizationId: {
          email,
          organizationId: session.user.organizationId
        }
      }
    });

    if (existingInvitation && existingInvitation.expiresAt > new Date()) {
      return NextResponse.json(
        { error: 'Invitation already sent and still valid' },
        { status: 400 }
      );
    }

    // Generate secure invitation token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Delete existing invitation if it exists (expired ones)
    if (existingInvitation) {
      await prisma.invitation.delete({
        where: { id: existingInvitation.id }
      });
    }

    // Create new invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        organizationId: session.user.organizationId,
        invitedBy: session.user.id,
        role,
        token,
        expiresAt,
      },
      include: {
        organization: true,
        inviter: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Send invitation email
    const inviteUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/register/join?token=${token}`;
    
    try {
      const emailHtml = createInvitationEmail({
        inviteeName: email.split('@')[0], // Use email username as fallback name
        organizationName: invitation.organization.name,
        inviterName: `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
        role: invitation.role,
        inviteUrl,
        expiresAt: invitation.expiresAt
      });

      const emailResult = await sendEmail({
        to: email,
        subject: `You've been invited to join ${invitation.organization.name}`,
        html: emailHtml
      });

      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error);
        // Continue with the response even if email fails
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue with the response even if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        // Don't return the actual token for security
        inviteUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/register/join?token=${token}`
      }
    });

  } catch (error) {
    console.error('Invitation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}