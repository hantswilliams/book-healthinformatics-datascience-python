import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: text || stripHtml(html), // Auto-generate text version if not provided
    });

    // Check if there's a Resend error in the response
    if (result.error) {
      console.error('Resend API error:', result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

// Simple HTML to text converter for fallback
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&')  // Replace &amp; with &
    .replace(/&lt;/g, '<')   // Replace &lt; with <
    .replace(/&gt;/g, '>')   // Replace &gt; with >
    .replace(/\s+/g, ' ')    // Replace multiple whitespace with single space
    .trim();
}

// Email template helpers
export function createEmailTemplate({
  title,
  content,
  ctaText,
  ctaUrl,
  footerText = 'Python Interactive Learning Platform'
}: {
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #4f46e5; padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 32px; }
        .content h2 { color: #1f2937; margin-bottom: 16px; }
        .content p { color: #4b5563; line-height: 1.6; margin-bottom: 16px; }
        .cta { text-align: center; margin: 32px 0; }
        .cta a { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { background-color: #f3f4f6; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
        .divider { height: 1px; background-color: #e5e7eb; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐍 Python Interactive</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${content}
          ${ctaText && ctaUrl ? `
            <div class="cta">
              <a href="${ctaUrl}">${ctaText}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <div class="divider"></div>
          <p>${footerText}</p>
          <p>If you didn't expect this email, you can safely ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}