import { createClient } from '@supabase/supabase-js';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use Supabase Edge Function for email sending (Resend is more reliable than SMTP)
    const { data, error } = await supabase.functions.invoke('send-email-resend', {
      body: {
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || stripHtml(html)
      }
    });

    if (error) {
      console.error('Supabase SMTP function error:', error);
      
      // Fallback: Log email in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email fallback (SMTP function failed):', {
          to: Array.isArray(to) ? to : [to],
          subject,
          text: text || stripHtml(html),
          error: error.message
        });
        
        return { 
          success: true, 
          data: { 
            id: `fallback-email-${Date.now()}`,
            message: 'Email logged (SMTP function not deployed)'
          } 
        };
      }
      
      return { success: false, error: error.message || 'Failed to send email' };
    }

    // Check if the Edge Function returned an error
    if (data && !data.success) {
      console.error('SMTP function returned error:', data.error);
      
      // Fallback: Log email in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email fallback (SMTP error):', {
          to: Array.isArray(to) ? to : [to],
          subject,
          text: text || stripHtml(html),
          error: data.error
        });
        
        return { 
          success: true, 
          data: { 
            id: `fallback-email-${Date.now()}`,
            message: 'Email logged (SMTP not configured)'
          } 
        };
      }
      
      return { success: false, error: data.error };
    }

    console.log('✅ Email sent successfully via Supabase SMTP:', {
      to: Array.isArray(to) ? to : [to],
      subject,
      id: data?.data?.id
    });

    return { 
      success: true, 
      data: data?.data || { 
        id: `smtp-email-${Date.now()}`,
        message: 'Email sent successfully via SMTP'
      }
    };

  } catch (error) {
    console.error('Failed to send email via Supabase SMTP:', error);
    
    // Fallback: Log email in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email fallback (connection error):', {
        to: Array.isArray(to) ? to : [to],
        subject,
        text: text || stripHtml(html),
        error: error instanceof Error ? error.message : String(error)
      });
      
      return { 
        success: true, 
        data: { 
          id: `fallback-email-${Date.now()}`,
          message: 'Email logged (connection error)'
        } 
      };
    }
    
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
  footerText = 'Interactive Coding Platform'
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
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #fafbfc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%); padding: 40px 32px; text-align: center; position: relative; }
        .header::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at top, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%); }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.025em; position: relative; }
        .content { padding: 40px 32px; }
        .content h2 { color: #18181b; margin-bottom: 20px; font-size: 20px; font-weight: 600; }
        .content p { color: #52525b; line-height: 1.7; margin-bottom: 20px; font-size: 16px; }
        .cta { text-align: center; margin: 40px 0; }
        .cta a { 
          display: inline-block; 
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          transition: all 0.2s ease;
        }
        .cta a:hover { transform: translateY(-1px); box-shadow: 0 8px 15px -3px rgb(0 0 0 / 0.1); }
        .footer { background-color: #f4f4f5; padding: 32px 24px; text-align: center; color: #71717a; font-size: 14px; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, #e4e4e7, transparent); margin: 32px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ Interactive Coding</h1>
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