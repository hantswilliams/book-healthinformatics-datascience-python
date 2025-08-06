import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { createEmailTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();
    
    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Create a test email
    const testEmailHtml = createEmailTemplate({
      title: 'Email System Test',
      content: `
        <p>This is a test email from your Python Interactive Learning Platform!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937;">✅ Email System Working</h3>
          <p style="margin: 0; color: #4b5563; font-size: 14px;">
            Your Resend integration is properly configured and emails are being delivered successfully.
          </p>
        </div>

        <p><strong>Test Details:</strong></p>
        <ul>
          <li>📧 Service: Resend</li>
          <li>🕐 Sent at: ${new Date().toLocaleString()}</li>
          <li>🎯 Status: Successfully delivered</li>
        </ul>
      `,
      footerText: 'Python Interactive Learning Platform • Email Test'
    });

    const result = await sendEmail({
      to,
      subject: '🧪 Email System Test - Python Interactive',
      html: testEmailHtml
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        data: result.data
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send test email',
          details: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}