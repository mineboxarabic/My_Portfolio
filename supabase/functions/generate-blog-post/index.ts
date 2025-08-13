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
    model: "gpt-4o-mini", // Switched to faster model
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

    // 1. Generate multilingual content in one call
    const generationSystemPrompt = `You are an expert multilingual blog post writer and researcher. Given a topic, you will generate a comprehensive, detailed, and engaging blog post in English, French, and Arabic with well-researched content and valuable resources.

    Your response must be a JSON object with the following structure:
    {
      "title": {"en": "English title", "fr": "French title", "ar": "Arabic title"},
      "excerpt": {"en": "English excerpt", "fr": "French excerpt", "ar": "Arabic excerpt"},
      "content": {"en": "English content in HTML", "fr": "French content in HTML", "ar": "Arabic content in HTML"}
    }
    
    CONTENT STRUCTURE REQUIREMENTS:
    1. **Introduction** (2-3 paragraphs): Hook the reader and provide context
    2. **Main Content** (4-6 detailed sections): Each with h2/h3 headings, comprehensive explanations, examples, and practical insights
    3. **Key Takeaways** (bullet points): 5-7 actionable insights
    4. **Resources Section**: Must include this exact HTML structure with real, valuable resources:
    
    <h2>📚 Useful Resources</h2>
    <div class="resources-section" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>🔗 Essential Links</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #007bff;">
          <strong><a href="[REAL_URL]" target="_blank" rel="noopener">[Resource Title]</a></strong><br>
          <span style="color: #666; font-size: 14px;">[Brief description of what this resource offers]</span>
        </li>
        <!-- Repeat for 4-6 resources -->
      </ul>
      
      <h3>📖 Recommended Reading</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #28a745;">
          <strong>"[Book/Article Title]"</strong> by [Author]<br>
          <span style="color: #666; font-size: 14px;">[Why this is valuable for the topic]</span>
        </li>
        <!-- Repeat for 3-4 books/articles -->
      </ul>
      
      <h3>🛠️ Tools & Platforms</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #fd7e14;">
          <strong>[Tool Name]</strong> - <a href="[REAL_URL]" target="_blank" rel="noopener">[Website]</a><br>
          <span style="color: #666; font-size: 14px;">[What this tool does and why it's useful]</span>
        </li>
        <!-- Repeat for 3-5 tools -->
      </ul>
    </div>
    
    5. **Conclusion** (1-2 paragraphs): Summarize key points and call-to-action
    
    QUALITY STANDARDS:
    - Write 2000+ words of substantial, well-researched content
    - Include real URLs, tools, books, and resources (not placeholders)
    - Use proper HTML formatting (h2, h3, p, ul, li, strong, em)
    - Add practical examples, case studies, or real-world applications
    - Ensure cultural appropriateness for each language
    - For Arabic: Use Modern Standard Arabic (MSA)
    - For French: Use proper grammar and cultural context
    - Make content comprehensive, SEO-friendly, and actionable
    - Include statistics, trends, or current data when relevant
    
    RESOURCE REQUIREMENTS:
    - All links must be real, working URLs to valuable resources
    - Include a mix of official documentation, tutorials, tools, and educational content
    - Provide 10-15 total resources across the three categories
    - Each resource must have a clear description of its value`
    
    const userPromptForText = `Topic: ${topic}

Please write a comprehensive, detailed, and well-researched blog post on this topic in English, French, and Arabic. 

SPECIFIC REQUIREMENTS:
1. Make it extremely detailed with practical insights and actionable advice
2. Include real statistics, current trends, and up-to-date information
3. Add concrete examples and case studies
4. Create a comprehensive resources section with:
   - Real, working links to valuable websites, documentation, and tools
   - Recommended books and articles by actual authors
   - Useful tools and platforms with their actual URLs
   - Educational resources and tutorials
5. Ensure the content is 2000+ words and provides genuine value
6. Make it engaging and easy to follow with clear structure
7. Include practical tips that readers can immediately apply

Focus on creating content that would be genuinely helpful to someone learning about this topic, with real resources they can explore further.`
    const multilingualContentJson = await getCompletion(generationSystemPrompt, userPromptForText, true)
    if (!multilingualContentJson) throw new Error("Failed to generate multilingual content.")
    const contentData = JSON.parse(multilingualContentJson)

    // 2. Generate image with DALL-E 3
    const imageGenerationPrompt = `A high-quality, vibrant, and professional blog post header image for an article titled: "${contentData.title.en}". Style: photorealistic, clean, modern. No text in the image.`;
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

    // 4. Construct the final response (no translation needed - already multilingual)
    const responseData = {
      title: contentData.title,
      excerpt: contentData.excerpt,
      content: contentData.content,
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