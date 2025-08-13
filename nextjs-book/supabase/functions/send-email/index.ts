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

console.log("Email service function started!")

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

    // Get environment variables
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com'
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured' 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    }

    // Prepare email data
    const emailData = {
      from: emailRequest.from || FROM_EMAIL,
      to: Array.isArray(emailRequest.to) ? emailRequest.to : [emailRequest.to],
      subject: emailRequest.subject,
      html: emailRequest.html,
      text: emailRequest.text || stripHtml(emailRequest.html)
    }

    console.log('Sending email via Resend:', {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.from
    })

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailData),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: resendData.message || 'Failed to send email' 
        }),
        { 
          status: resendResponse.status, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    }

    console.log('Email sent successfully:', resendData)

    const response: EmailResponse = { 
      success: true, 
      data: {
        id: resendData.id,
        message: 'Email sent successfully'
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
    console.error('Error in send-email function:', error)
    
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"to":"test@example.com","subject":"Test","html":"<h1>Hello World</h1>"}'

*/