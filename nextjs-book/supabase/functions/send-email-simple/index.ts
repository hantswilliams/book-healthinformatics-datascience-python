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

console.log("Simple SMTP Email service function started!")

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
    const SMTP_HOST = Deno.env.get('SMTP_HOST')
    const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587'
    const SMTP_USER = Deno.env.get('SMTP_USER')
    const SMTP_PASS = Deno.env.get('SMTP_PASS')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || SMTP_USER
    
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.error('SMTP credentials not configured')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured. Please set SMTP environment variables.' 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    }

    const toAddresses = Array.isArray(emailRequest.to) ? emailRequest.to : [emailRequest.to]

    console.log('Attempting to send email:', {
      to: toAddresses,
      subject: emailRequest.subject,
      from: emailRequest.from || FROM_EMAIL,
      smtpHost: SMTP_HOST,
      smtpPort: SMTP_PORT,
      smtpUser: SMTP_USER ? 'SET' : 'NOT SET'
    })

    try {
      // Use the correct SMTP library syntax for Deno
      const smtp = await import("https://deno.land/x/smtp@v0.7.0/mod.ts")
      
      const client = new smtp.SmtpClient()
      
      await client.connectTLS({
        hostname: SMTP_HOST,
        port: parseInt(SMTP_PORT),
        username: SMTP_USER,
        password: SMTP_PASS,
      })

      // Send to each recipient separately for better reliability
      for (const recipient of toAddresses) {
        console.log(`Sending email to: ${recipient}`)
        
        await client.send({
          from: emailRequest.from || FROM_EMAIL!,
          to: recipient,
          subject: emailRequest.subject,
          content: emailRequest.text || stripHtml(emailRequest.html),
          html: emailRequest.html,
        })
        
        console.log(`Email sent successfully to: ${recipient}`)
      }

      await client.close()
      
      console.log('All emails sent successfully')

      const response: EmailResponse = { 
        success: true, 
        data: {
          id: `smtp-email-${Date.now()}`,
          message: 'Email sent successfully via SMTP',
          recipients: toAddresses.length
        }
      }

      return new Response(
        JSON.stringify(response),
        { 
          status: 200,
          headers: { "Content-Type": "application/json" } 
        }
      )

    } catch (smtpError) {
      console.error('SMTP Error:', smtpError)
      
      const response: EmailResponse = { 
        success: false, 
        error: `SMTP Error: ${smtpError.message || String(smtpError)}` 
      }

      return new Response(
        JSON.stringify(response),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    }

  } catch (error) {
    console.error('Error in send-email-simple function:', error)
    
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email-simple' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"to":"test@example.com","subject":"Test","html":"<h1>Hello World</h1>"}'

*/