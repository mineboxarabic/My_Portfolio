# Email Setup Guide for Contact Form

The contact form supports multiple email sending methods with automatic fallbacks:

## Method 1: EmailJS (Recommended) 

EmailJS allows sending emails directly from the frontend without a backend server.

### Setup Steps:

1. **Sign up at [EmailJS.com](https://www.emailjs.com/)**

2. **Create an Email Service:**
   - Go to Email Services
   - Click "Add New Service"
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the setup instructions

3. **Create an Email Template:**
   - Go to Email Templates  
   - Click "Create New Template"
   - Use this template structure:
   
   ```
   Subject: New Contact from {{from_name}}
   
   From: {{from_name}} <{{from_email}}>
   
   Message:
   {{message}}
   
   ---
   This message was sent from your portfolio contact form.
   Reply to: {{reply_to}}
   ```

4. **Get Your Credentials:**
   - Service ID: Found in Email Services
   - Template ID: Found in Email Templates  
   - Public Key: Found in Account → API Keys

5. **Create `.env` file in project root:**
   ```bash
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id  
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

6. **Restart your development server**

## Method 2: Supabase Edge Function (Alternative)

For server-side email sending using Resend API:

1. **Set up Resend account at [resend.com](https://resend.com/)**
2. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy send-contact-email
   ```
3. **Set environment variable:**
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   ```

## Method 3: Mailto Fallback (Always Available)

If neither EmailJS nor Supabase is configured, the form will:
- Open the user's email client with pre-filled content
- Copy message to clipboard as backup
- Show manual email address if all else fails

## Testing the Contact Form

1. Fill out the contact form
2. Click "Send Message"
3. Check the browser console for debugging info
4. Verify the email was received

## Troubleshooting

- **EmailJS not working?** Check browser console for errors
- **Environment variables not loading?** Restart dev server
- **Emails not receiving?** Check spam folder
- **CORS errors?** Verify EmailJS domain settings

The contact form will automatically fallback to simpler methods if advanced options aren't configured.
