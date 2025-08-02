import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.49.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NOTE: This requires the OPEN_AI_API secret to be set in your Supabase project settings.
const openai = new OpenAI({
  apiKey: Deno.env.get("OPEN_AI_API"),
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, text, prompt } = await req.json()

    if (!type || (type === 'improve' && !text) || (type === 'generate' && !prompt)) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let systemPrompt = ''
    let userMessage = ''

    if (type === 'improve') {
      systemPrompt = "You are an expert copy editor. Correct the following text for grammar, spelling, and style. Make it more professional, clear, and concise. Only return the improved text, without any explanations or conversational text."
      userMessage = text
    } else if (type === 'generate') {
      systemPrompt = "You are a creative assistant. Generate a short text based on the user's prompt. The response should be concise and directly usable in a form field. Only return the generated text, without any explanations or conversational text."
      userMessage = prompt
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type parameter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "gpt-3.5-turbo", // Using a cost-effective model
      temperature: 0.7,
      max_tokens: 300,
    })

    const aiResponse = completion.choices[0].message.content

    return new Response(JSON.stringify({ result: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})