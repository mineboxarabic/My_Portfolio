import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.49.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    console.log("Testing OpenAI API connection...");
    
    const openaiKey = Deno.env.get("OPEN_AI_API");
    console.log("OpenAI API key exists:", !!openaiKey);
    console.log("OpenAI API key first 10 chars:", openaiKey?.substring(0, 10));

    const openai = new OpenAI({
      apiKey: openaiKey,
    });

    console.log("Making simple OpenAI API call...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: "Say hello in 5 words" }
      ],
      max_tokens: 20,
    });

    console.log("OpenAI API call successful!");
    
    return new Response(JSON.stringify({
      success: true,
      message: "OpenAI API is working",
      response: response.choices[0].message.content
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("OpenAI API test failed:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
