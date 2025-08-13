import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { sendEmail } from '@/lib/email';
import { createVerificationCodeEmail } from '@/lib/email-templates';
import { z } from 'zod';
import crypto from 'crypto';

const sendCodeSchema = z.object({
  email: z.string().email(),
  orgSlug: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const body = await request.json();
    const { email, orgSlug } = sendCodeSchema.parse(body);

    // Check if user exists in our system - proper join syntax for foreign key relationship
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organizations!users_organization_id_fkey(
          id,
          name,
          slug
        )
      `)
      .eq('email', email);

    if (userError) {
      console.error('Database error looking up user:', userError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log(`No user found with email: ${email}`);
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // If orgSlug is provided, filter results by organization
    let user;
    if (orgSlug) {
      user = users.find(u => u.organizations?.slug === orgSlug);
      if (!user) {
        return NextResponse.json(
          { error: 'No account found with this email address in the specified organization' },
          { status: 404 }
        );
      }
    } else {
      // If no orgSlug provided, use the first user
      user = users[0];
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Clean up any existing codes for this email
    await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email);

    // Store the verification code
    const { error: codeError } = await supabase
      .from('verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        attempts: 0
      });

    if (codeError) {
      console.error('Error storing verification code:', codeError);
      return NextResponse.json(
        { error: 'Failed to generate verification code' },
        { status: 500 }
      );
    }

    // Send email with verification code
    try {
      const emailHtml = createVerificationCodeEmail({
        userName: user.first_name || user.username || email.split('@')[0],
        organizationName: user.organizations?.name || 'Python Interactive',
        verificationCode: code,
        expiresInMinutes: 10
      });

      const emailResult = await sendEmail({
        to: email,
        subject: `Your verification code: ${code}`,
        html: emailHtml
      });

      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
      }

      // In development, log the code for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔢 Verification code for ${email}: ${code} (expires in 10 minutes)`);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue with response even if email fails in development
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}`,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Send code error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}