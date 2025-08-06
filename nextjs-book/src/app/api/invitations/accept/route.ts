import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { createWelcomeEmail } from '@/lib/email-templates';
import { z } from 'zod';

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  username: z.string().min(3).max(30),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = acceptInviteSchema.parse(body);

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token: validatedData.token },
      include: {
        organization: true
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation has already been accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'Invitation has already been accepted' },
        { status: 400 }
      );
    }

    // Check if email already exists in system
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if username is taken
    const existingUsername = await prisma.user.findUnique({
      where: { username: validatedData.username }
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Check if organization has reached seat limit
    const currentUserCount = await prisma.user.count({
      where: { organizationId: invitation.organizationId }
    });

    if (currentUserCount >= invitation.organization.maxSeats) {
      return NextResponse.json(
        { error: 'Organization has reached its seat limit' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user and mark invitation as accepted in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: invitation.email,
          username: validatedData.username,
          password: hashedPassword,
          role: invitation.role,
          organizationId: invitation.organizationId,
          invitedBy: invitation.invitedBy,
          onboardingCompleted: false,
        }
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() }
      });

      return { user };
    });

    // Send welcome email
    try {
      const loginUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`;
      
      const emailHtml = createWelcomeEmail({
        userName: `${result.user.firstName} ${result.user.lastName}`,
        organizationName: invitation.organization.name,
        loginUrl
      });

      const emailResult = await sendEmail({
        to: result.user.email,
        subject: `Welcome to ${invitation.organization.name}!`,
        html: emailHtml
      });

      if (!emailResult.success) {
        console.error('Failed to send welcome email:', emailResult.error);
        // Continue with the response even if email fails
      }
    } catch (emailError) {
      console.error('Welcome email sending error:', emailError);
      // Continue with the response even if email fails
    }

    // Return success response (excluding sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        userId: result.user.id,
        organizationSlug: invitation.organization.slug,
        role: result.user.role,
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}