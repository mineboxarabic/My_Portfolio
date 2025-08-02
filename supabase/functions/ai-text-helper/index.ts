import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.49.1"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NOTE: This requires the OPEN_AI_API secret to be set in your Supabase project settings.
const openai = new OpenAI({
  apiKey: Deno.env.get("OPEN_AI_API"),
})

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Helper function to get contextual data based on context type
async function getContextualData(contextType: string, contextId?: string) {
  try {
    switch (contextType) {
      case 'projects':
        const { data: projects } = await supabaseAdmin
          .from('projects')
          .select('name, description, tech_stack')
          .limit(5)
          .order('created_at', { ascending: false });
        return projects;
        
      case 'project_details':
        if (contextId) {
          const { data: projectDetail } = await supabaseAdmin
            .from('project_details')
            .select('*')
            .eq('id', contextId)
            .single();
          return projectDetail;
        }
        break;
        
      case 'blogs':
        const { data: posts } = await supabaseAdmin
          .from('posts')
          .select('title, excerpt, content')
          .limit(5)
          .order('created_at', { ascending: false });
        return posts;
        
      case 'skills':
        const { data: skills } = await supabaseAdmin
          .from('skills')
          .select('name, category, level')
          .order('created_at', { ascending: false });
        return skills;
        
      case 'about':
        const { data: about } = await supabaseAdmin
          .from('about_me')
          .select('title, content')
          .limit(1)
          .single();
        return about;
        
      default:
        return null;
    }
  } catch (error) {
    console.warn('Failed to fetch contextual data:', error);
    return null;
  }
}

// Helper function to build context-aware prompts
function buildContextualPrompt(type: string, basePrompt: string, contextData: any, contextType?: string) {
  let contextualInfo = '';
  
  if (contextData && contextType) {
    switch (contextType) {
      case 'projects':
        if (Array.isArray(contextData)) {
          contextualInfo = `\n\nContext: Here are some of your recent projects for reference:\n${contextData.map(p => 
            `- ${typeof p.name === 'object' ? p.name.en : p.name}: ${typeof p.description === 'object' ? p.description.en : p.description} (Tech: ${Array.isArray(p.tech_stack) ? p.tech_stack.join(', ') : p.tech_stack})`
          ).join('\n')}`;
        }
        break;
        
      case 'project_details':
        if (contextData) {
          contextualInfo = `\n\nContext: You are working on a project with these details:\n- Tagline: ${typeof contextData.tagline === 'object' ? contextData.tagline.en : contextData.tagline}\n- Problem: ${typeof contextData.problem_statement === 'object' ? contextData.problem_statement.en : contextData.problem_statement}\n- Goal: ${typeof contextData.project_goal === 'object' ? contextData.project_goal.en : contextData.project_goal}`;
        }
        break;
        
      case 'blogs':
        if (Array.isArray(contextData)) {
          contextualInfo = `\n\nContext: Here are some of your recent blog posts for reference:\n${contextData.map(p => 
            `- ${typeof p.title === 'object' ? p.title.en : p.title}: ${typeof p.excerpt === 'object' ? p.excerpt.en : p.excerpt}`
          ).slice(0, 3).join('\n')}`;
        }
        break;
        
      case 'skills':
        if (Array.isArray(contextData)) {
          const skillsByCategory = contextData.reduce((acc, skill) => {
            const category = typeof skill.category === 'object' ? skill.category.en : skill.category;
            if (!acc[category]) acc[category] = [];
            acc[category].push(typeof skill.name === 'object' ? skill.name.en : skill.name);
            return acc;
          }, {});
          contextualInfo = `\n\nContext: Here are your skills by category:\n${Object.entries(skillsByCategory).map(([cat, skills]) => 
            `- ${cat}: ${skills.join(', ')}`
          ).join('\n')}`;
        }
        break;
        
      case 'about':
        if (contextData) {
          contextualInfo = `\n\nContext: Here's your current about section:\n- Title: ${typeof contextData.title === 'object' ? contextData.title.en : contextData.title}\n- Content: ${typeof contextData.content === 'object' ? contextData.content.en : contextData.content}`;
        }
        break;
    }
  }
  
  return basePrompt + contextualInfo;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, text, prompt, context } = await req.json()

    if (!type || (type === 'improve' && !text) || (type === 'generate' && !prompt)) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Get contextual data if context is provided
    const contextData = context ? await getContextualData(context.type, context.id) : null;

    let systemPrompt = ''
    let userMessage = ''

    if (type === 'improve') {
      const basePrompt = `You are an expert multilingual copy editor. Improve the given text and return ONLY a JSON object with three language versions.

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

REMEMBER: Respond with ONLY the JSON object. No explanations, no other text.`;
      
      systemPrompt = buildContextualPrompt('improve', basePrompt, contextData, context?.type);
      userMessage = text
    } else if (type === 'generate') {
      const basePrompt = `You are a creative multilingual content creator. Generate text based on the prompt and return ONLY a JSON object with three language versions.

CRITICAL: You must respond with ONLY valid JSON in this EXACT format:
{"en": "generated English text", "fr": "generated French text", "ar": "generated Arabic text"}

Generation guidelines:
- Create original, engaging content
- Make it culturally appropriate for each language
- Keep professional yet engaging tone
- For Arabic: Use eloquent MSA
- For French: Appropriate register and cultural references
- For English: Clear, engaging language

REMEMBER: Respond with ONLY the JSON object. No explanations, no other text.`;
      
      systemPrompt = buildContextualPrompt('generate', basePrompt, contextData, context?.type);
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