// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface EmailResponse {
  success: boolean;
  data?: any;
  error?: string;
}

console.log("Supabase SMTP Email service function started!")

Deno.serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    }

    // Parse request body
    const emailRequest: EmailRequest = await req.json()
    
    // Validate required fields
    if (!emailRequest.to || !emailRequest.subject || !emailRequest.html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, html' 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    }

    // Get environment variables for SMTP
    const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const SMTP_USER = Deno.env.get('SMTP_USER')
    const SMTP_PASS = Deno.env.get('SMTP_PASS')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || SMTP_USER
    
    if (!SMTP_USER || !SMTP_PASS) {
      console.error('SMTP credentials not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.' 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    }

    const toAddresses = Array.isArray(emailRequest.to) ? emailRequest.to : [emailRequest.to]

    console.log('Sending email via SMTP:', {
      to: toAddresses,
      subject: emailRequest.subject,
      from: emailRequest.from || FROM_EMAIL,
      smtpHost: SMTP_HOST,
      smtpPort: SMTP_PORT
    })

    try {
      // Import SMTP library for Deno with better error handling
      const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts")
      
      const client = new SMTPClient({
        connection: {
          hostname: SMTP_HOST,
          port: SMTP_PORT,
          tls: true,
          auth: {
            username: SMTP_USER,
            password: SMTP_PASS,
          },
        },
      })

      // Prepare email content with better formatting
      const emailContent = {
        from: emailRequest.from || FROM_EMAIL!,
        to: toAddresses.join(','), // Join multiple recipients with comma
        subject: emailRequest.subject,
        content: emailRequest.text || stripHtml(emailRequest.html),
        html: emailRequest.html,
      }

      console.log('Email content prepared:', {
        from: emailContent.from,
        to: emailContent.to,
        subject: emailContent.subject,
        hasHtml: !!emailContent.html,
        hasText: !!emailContent.content
      })

      // Send email via SMTP
      await client.send(emailContent)
      await client.close()

      console.log('Email sent successfully via SMTP')

    } catch (smtpError) {
      console.error('SMTP sending error:', smtpError)
      throw new Error(`SMTP Error: ${smtpError.message || smtpError}`)
    }

    console.log('Email sent successfully via SMTP')

    const response: EmailResponse = { 
      success: true, 
      data: {
        id: `smtp-email-${Date.now()}`,
        message: 'Email sent successfully via SMTP'
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { "Content-Type": "application/json" } 
      }
    )

  } catch (error) {
    console.error('Error in send-email-smtp function:', error)
    
    const response: EmailResponse = { 
      success: false, 
      error: error.message || 'Internal server error' 
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    )
  }
})

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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email-smtp' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"to":"test@example.com","subject":"Test","html":"<h1>Hello World</h1>"}'

*/