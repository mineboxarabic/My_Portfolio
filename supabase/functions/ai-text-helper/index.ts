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
      systemPrompt = `You are an expert multilingual copy editor. Improve the given text and return ONLY a JSON object with three language versions.

CRITICAL: You must respond with ONLY valid JSON in this EXACT format:
{"en": "improved English text", "fr": "improved French text", "ar": "improved Arabic text"}

Improvement guidelines:
- Correct grammar, spelling, punctuation errors
- Enhance clarity and readability  
- Make tone more professional
- Improve word choice and structure
- For Arabic: Use proper MSA
- For French: Proper accents and agreements
- For English: Clear, professional language

REMEMBER: Respond with ONLY the JSON object. No explanations, no other text.`
      userMessage = text
    } else if (type === 'generate') {
      systemPrompt = `You are a creative multilingual content creator. Generate text based on the prompt and return ONLY a JSON object with three language versions.

CRITICAL: You must respond with ONLY valid JSON in this EXACT format:
{"en": "generated English text", "fr": "generated French text", "ar": "generated Arabic text"}

Generation guidelines:
- Create original, engaging content
- Make it culturally appropriate for each language
- Keep professional yet engaging tone
- For Arabic: Use eloquent MSA
- For French: Appropriate register and cultural references
- For English: Clear, engaging language

REMEMBER: Respond with ONLY the JSON object. No explanations, no other text.`
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
        { role: "assistant", content: "{\"en\": \"" }
      ],
      model: "gpt-4o-mini", // Using GPT-4o-mini for better multilingual capabilities
      temperature: 0.7,
      max_tokens: 800, // Increased for multilingual responses
      response_format: { type: "json_object" }, // Ensure we get a JSON response
    })

    const aiResponse = completion.choices[0].message.content
    console.log('Raw AI response:', aiResponse)

    // Try to parse the JSON response from AI
    let parsedResponse
    try {
      // Clean the response - remove any markdown or extra text
      let cleanResponse = aiResponse || ''
      
      // If the response doesn't start with {, try to find JSON
      if (!cleanResponse.trim().startsWith('{')) {
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          cleanResponse = jsonMatch[0]
        } else {
          throw new Error('No JSON object found in response')
        }
      }
      
      // If the assistant response was primed with partial JSON, complete it
      if (cleanResponse.startsWith('{"en": "') && !cleanResponse.endsWith('}')) {
        // This means the AI continued from our priming - we need to parse it carefully
        console.log('Detected partial JSON completion')
      }
      
      parsedResponse = JSON.parse(cleanResponse)
      console.log('Parsed response:', parsedResponse)
      
      // Validate that we have all three languages and they're not empty
      if (!parsedResponse.en || !parsedResponse.fr || !parsedResponse.ar ||
          typeof parsedResponse.en !== 'string' || typeof parsedResponse.fr !== 'string' || typeof parsedResponse.ar !== 'string') {
        throw new Error('AI response missing required languages or invalid format')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.error('Raw response was:', aiResponse)
      
      // Enhanced fallback: try to extract meaningful text
      let fallbackText = aiResponse || 'Generated text'
      
      // Remove any JSON artifacts or incomplete formatting
      fallbackText = fallbackText.replace(/^\{"en":\s*"?/, '').replace(/["}]+$/, '').trim()
      
      parsedResponse = {
        en: fallbackText || 'Generated text',
        fr: fallbackText || 'Texte généré',
        ar: fallbackText || 'نص مُولد'
      }
      console.log('Using fallback response:', parsedResponse)
    }

    return new Response(JSON.stringify({ result: parsedResponse }), {
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