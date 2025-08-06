import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const registerSchema = z.object({
  // Organization details
  organizationName: z.string().min(2).max(100),
  organizationSlug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  industry: z.enum(['GENERAL', 'HEALTHCARE', 'FINANCE', 'TECHNOLOGY', 'EDUCATION', 'MANUFACTURING', 'GOVERNMENT', 'NON_PROFIT']),
  website: z.string().url().optional(),
  
  // Owner details
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  
  // Subscription details
  subscriptionTier: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).default('STARTER'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if organization slug is available
    const existingOrgBySlug = await prisma.organization.findUnique({
      where: { slug: validatedData.organizationSlug }
    });

    if (existingOrgBySlug) {
      return NextResponse.json(
        { error: 'Organization slug already taken' },
        { status: 400 }
      );
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
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

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Set trial period (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Set max seats based on tier
    const maxSeats = {
      STARTER: 5,
      PRO: 25,
      ENTERPRISE: 999 // "unlimited" 
    }[validatedData.subscriptionTier];

    // Create organization and owner user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organizationName,
          slug: validatedData.organizationSlug,
          industry: validatedData.industry,
          website: validatedData.website,
          subscriptionStatus: 'TRIAL',
          subscriptionTier: validatedData.subscriptionTier,
          maxSeats,
          trialEndsAt,
        }
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          username: validatedData.username,
          password: hashedPassword,
          role: 'OWNER',
          organizationId: organization.id,
          onboardingCompleted: false,
        }
      });

      return { organization, user };
    });

    // Return success response (excluding sensitive data)
    return NextResponse.json({
      success: true,
      data: {
        organizationId: result.organization.id,
        organizationSlug: result.organization.slug,
        userId: result.user.id,
        trialEndsAt: result.organization.trialEndsAt,
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}