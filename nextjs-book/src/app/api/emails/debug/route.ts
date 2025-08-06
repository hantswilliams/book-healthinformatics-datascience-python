import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();
    
    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Debug environment variables
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    console.log('Debug info:', {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey?.substring(0, 10) + '...',
      fromEmail,
      to
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Initialize Resend directly
    const resend = new Resend(apiKey);

    // Send basic test email
    const result = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: 'Simple Resend Test',
      html: '<p>This is a simple test email from Resend!</p>',
      text: 'This is a simple test email from Resend!'
    });

    console.log('Resend result:', result);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: result,
      debug: {
        fromEmail,
        to,
        hasApiKey: !!apiKey
      }
    });

  } catch (error) {
    console.error('Debug email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}