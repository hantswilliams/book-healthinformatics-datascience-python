import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { createTrialWarningEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  try {
    // Get organizations that are in trial and expiring soon
    const today = new Date();
    const warningDays = [7, 3, 1]; // Send warnings at 7, 3, and 1 days before expiration
    
    const organizations = await prisma.organization.findMany({
      where: {
        subscriptionStatus: 'TRIAL',
        trialEndsAt: {
          not: null,
          gte: today,
          lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      },
      include: {
        users: {
          where: { role: 'OWNER' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const emailsSent = [];
    const errors = [];

    for (const org of organizations) {
      if (!org.trialEndsAt || org.users.length === 0) continue;

      const owner = org.users[0];
      const daysUntilExpiry = Math.ceil(
        (org.trialEndsAt.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
      );

      // Only send warnings at specific day intervals
      if (!warningDays.includes(daysUntilExpiry)) continue;

      try {
        const billingUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/billing`;
        
        const emailHtml = createTrialWarningEmail({
          organizationName: org.name,
          ownerName: `${owner.firstName} ${owner.lastName}`,
          daysRemaining: daysUntilExpiry,
          billingUrl
        });

        const emailResult = await sendEmail({
          to: owner.email,
          subject: `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left in your free trial`,
          html: emailHtml
        });

        if (emailResult.success) {
          emailsSent.push({
            organizationId: org.id,
            organizationName: org.name,
            ownerEmail: owner.email,
            daysRemaining: daysUntilExpiry
          });
        } else {
          errors.push({
            organizationId: org.id,
            error: emailResult.error
          });
        }
      } catch (error) {
        console.error(`Error sending trial warning to ${org.name}:`, error);
        errors.push({
          organizationId: org.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        emailsSent: emailsSent.length,
        organizations: emailsSent,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Trial warning email error:', error);
    return NextResponse.json(
      { error: 'Failed to send trial warning emails' },
      { status: 500 }
    );
  }
}