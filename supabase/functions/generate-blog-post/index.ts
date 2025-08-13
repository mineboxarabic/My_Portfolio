import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.49.1"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const openai = new OpenAI({
  apiKey: Deno.env.get("OPEN_AI_API"),
})

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
};

serve(async (req) => {
  // Always handle CORS first
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
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

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Starting content generation...");
    
    // 1. Generate multilingual content in one call
    const generationSystemPrompt = `You are an expert multilingual blog post writer. Generate a comprehensive blog post in English, French, and Arabic.

    Your response must be a JSON object with this exact structure:
    {
      "title": {"en": "English title", "fr": "French title", "ar": "Arabic title"},
      "excerpt": {"en": "English excerpt", "fr": "French excerpt", "ar": "Arabic excerpt"},
      "content": {"en": "English content in HTML", "fr": "French content in HTML", "ar": "Arabic content in HTML"}
    }
    
    Make the content detailed and informative with proper HTML formatting (h2, h3, p, ul, li, strong, em).
    Include practical examples and actionable advice.
    For Arabic: Use Modern Standard Arabic (MSA).
    Write 1000+ words of substantial content for each language.`
    
    const userPromptForText = `Topic: ${topic}

Write a comprehensive, detailed blog post about this topic in English, French, and Arabic. Make it informative, engaging, and practical.`
    
    console.log("Making OpenAI API call for content generation...");
    const multilingualContentJson = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: generationSystemPrompt },
        { role: "user", content: userPromptForText },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000, // Limit tokens to prevent timeouts
    })
    
    if (!multilingualContentJson.choices[0].message.content) throw new Error("Failed to generate multilingual content.")
    console.log("Content generation successful");
    const contentData = JSON.parse(multilingualContentJson.choices[0].message.content)

    // 2. Generate image with DALL-E 3 (simplified)
    console.log("Generating image...");
    const imageGenerationPrompt = `A professional blog header image about: ${topic}. Clean, modern style. No text.`;
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imageGenerationPrompt,
      n: 1,
      size: "1024x1024", // Smaller size for faster generation
      response_format: "url",
    });
    const generatedImageUrl = imageResponse.data[0].url;
    if (!generatedImageUrl) throw new Error("Failed to generate image URL from DALL-E.");
    console.log("Image generation successful");

    // 3. Upload image to Supabase Storage
    console.log("Uploading image to storage...");
    const imageRes = await fetch(generatedImageUrl);
    if (!imageRes.ok) throw new Error("Failed to fetch the generated image from DALL-E URL.");
    const imageBlob = await imageRes.blob();
    const filePath = `public/${Date.now()}-${slugify(contentData.title.en)}.png`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(uploadData.path);
    const publicImageUrl = publicUrlData.publicUrl;
    console.log("Image upload successful");

    // 4. Construct the final response
    console.log("Preparing response...");
    const responseData = {
      title: contentData.title,
      excerpt: contentData.excerpt,
      content: contentData.content,
      featured_image_url: publicImageUrl,
    }

    console.log("Blog generation completed successfully");
    return new Response(JSON.stringify(responseData), {
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