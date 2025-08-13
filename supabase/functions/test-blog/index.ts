import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Always handle CORS first
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    console.log("Function started");
    
    const { topic } = await req.json()
    console.log("Received request with topic:", topic);
    
    if (!topic) {
      console.log("No topic provided");
      return new Response(JSON.stringify({ error: "Topic is required." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log("Processing topic:", topic);

    // Check environment variables
    const openaiKey = Deno.env.get("OPEN_AI_API");
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log("Environment check:");
    console.log("- OpenAI API key exists:", !!openaiKey);
    console.log("- Supabase URL exists:", !!supabaseUrl);
    console.log("- Supabase key exists:", !!supabaseKey);
    
    if (!openaiKey) {
      throw new Error("Missing OPEN_AI_API environment variable");
    }
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Return a simple mock response for testing
    const mockResponse = {
      title: {
        en: `Mock Blog Post: ${topic}`,
        fr: `Article de Blog Factice: ${topic}`,
        ar: `مقال مدونة وهمي: ${topic}`
      },
      excerpt: {
        en: "This is a test excerpt",
        fr: "Ceci est un extrait de test",
        ar: "هذا مقتطف تجريبي"
      },
      content: {
        en: `<h2>Test Content about ${topic}</h2><p>This is test content.</p>`,
        fr: `<h2>Contenu de test sur ${topic}</h2><p>Ceci est du contenu de test.</p>`,
        ar: `<h2>محتوى تجريبي حول ${topic}</h2><p>هذا محتوى تجريبي.</p>`
      },
      featured_image_url: "https://via.placeholder.com/800x400"
    }

    console.log("Returning mock response");

    return new Response(JSON.stringify(mockResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
