import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { name, email, message } = await req.json()

    // Validate input
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // If Resend API key is available, use it for sending emails
    if (RESEND_API_KEY) {
      const emailData = {
        from: 'Portfolio Contact <noreply@yourdomain.com>',
        to: ['yassin.younes@example.com'],
        subject: `Portfolio Contact from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
        text: `
          New Contact Form Submission
          
          Name: ${name}
          Email: ${email}
          
          Message:
          ${message}
        `
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      if (!response.ok) {
        throw new Error(`Resend API error: ${response.status}`)
      }

      const result = await response.json()
      console.log('Email sent successfully:', result)
    }

    // Store the contact form submission in Supabase (optional)
    // You can add database storage here if needed

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message sent successfully!' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send message',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
