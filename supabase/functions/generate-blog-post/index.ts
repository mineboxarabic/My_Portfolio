import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.49.1"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const openai = new OpenAI({
  apiKey: Deno.env.get("OPEN_AI_API"),
})

// Helper function to call OpenAI API
async function getCompletion(systemPrompt: string, userPrompt: string, isJson = false) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: isJson ? { type: "json_object" } : undefined,
    temperature: 0.7,
  })
  return response.choices[0].message.content
}

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { topic } = await req.json()
    if (!topic) {
      throw new Error("Topic is required.")
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Generate English content
    const generationSystemPrompt = `You are an expert blog post writer. Given a topic, you will generate a comprehensive and engaging blog post.
    Your response must be a JSON object with the following structure:
    {
      "title": "A catchy and SEO-friendly title for the blog post.",
      "excerpt": "A concise and compelling summary of the blog post, around 2-3 sentences.",
      "content": "The full content of the blog post in well-structured HTML format. Use headings (h2, h3), paragraphs (p), lists (ul, li), and bold text (strong) to format the content."
    }`
    const userPromptForText = `Topic: ${topic}. Please write a well-researched and detailed blog post on this topic. Ensure the information is accurate and up-to-date.`
    const englishContentJson = await getCompletion(generationSystemPrompt, userPromptForText, true)
    if (!englishContentJson) throw new Error("Failed to generate English content.")
    const englishContent = JSON.parse(englishContentJson)

    // 2. Generate image with DALL-E 3
    const imageGenerationPrompt = `A high-quality, vibrant, and professional blog post header image for an article titled: "${englishContent.title}". Style: photorealistic, clean, modern. No text in the image.`;
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imageGenerationPrompt,
      n: 1,
      size: "1792x1024",
      response_format: "url",
    });
    const generatedImageUrl = imageResponse.data[0].url;
    if (!generatedImageUrl) throw new Error("Failed to generate image URL from DALL-E.");

    // 3. Upload image to Supabase Storage
    const imageRes = await fetch(generatedImageUrl);
    if (!imageRes.ok) throw new Error("Failed to fetch the generated image from DALL-E URL.");
    const imageBlob = await imageRes.blob();
    const filePath = `public/${Date.now()}-${slugify(englishContent.title)}.png`;

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

    // 4. Translate the content
    const translationSystemPrompt = "You are an expert translator. Translate the following text accurately and naturally. Return only the translated text."
    const [title_fr, title_ar, excerpt_fr, excerpt_ar, content_fr, content_ar] = await Promise.all([
      getCompletion(translationSystemPrompt, `Translate to French: ${englishContent.title}`),
      getCompletion(translationSystemPrompt, `Translate to Arabic: ${englishContent.title}`),
      getCompletion(translationSystemPrompt, `Translate to French: ${englishContent.excerpt}`),
      getCompletion(translationSystemPrompt, `Translate to Arabic: ${englishContent.excerpt}`),
      getCompletion(translationSystemPrompt, `Translate to French: ${englishContent.content}`),
      getCompletion(translationSystemPrompt, `Translate to Arabic: ${englishContent.content}`),
    ])

    // 5. Construct the final response
    const responseData = {
      title: { en: englishContent.title, fr: title_fr, ar: title_ar },
      excerpt: { en: englishContent.excerpt, fr: excerpt_fr, ar: excerpt_ar },
      content: { en: englishContent.content, fr: content_fr, ar: content_ar },
      featured_image_url: publicImageUrl,
    }

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