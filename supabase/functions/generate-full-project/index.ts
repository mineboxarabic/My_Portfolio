import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.49.1"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPEN_AI_API"),
})

// Helper to call OpenAI API
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

// Helper to slugify text
const slugify = (text: string) => {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
};

// Helper to translate text
async function translateText(text: string, lang: string) {
  if (!text) return ""
  return await getCompletion(`You are an expert translator. Translate the following text to ${lang}. Return only the translated text.`, text)
}

// Helper to generate and upload a single image
async function generateAndUploadImage(prompt: string, projectName: string, supabaseAdmin: any, bucket: string) {
  if (!prompt) return null;
  console.log(`Generating image for: ${projectName} with prompt: ${prompt}`);
  const imageResponse = await openai.images.generate({
    model: "dall-e-3",
    prompt: `${prompt}. Style: photorealistic, clean, modern. No text in the image.`,
    n: 1,
    size: "1024x1024",
    response_format: "url",
  });
  const generatedImageUrl = imageResponse.data[0].url;
  if (!generatedImageUrl) return null;
  console.log(`Image URL from DALL-E: ${generatedImageUrl}`);

  const imageRes = await fetch(generatedImageUrl);
  if (!imageRes.ok) return null;
  const imageBlob = await imageRes.blob();
  const filePath = `public/${Date.now()}-${slugify(projectName)}-${Math.random()}.png`;

  console.log(`Uploading image to bucket: ${bucket}, path: ${filePath}`);
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, imageBlob, { contentType: 'image/png', cacheControl: '3600', upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(uploadData.path);
  
  console.log(`Image uploaded successfully: ${publicUrlData.publicUrl}`);
  return publicUrlData.publicUrl;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log("Initializing Supabase admin client...");
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // 1. Generate all text content from the prompt
    console.log("Generating project text content...");
    const systemPrompt = `You are an expert project manager and copywriter. Based on the user's prompt, generate a complete project case study. The response must be a JSON object with the exact following structure:
    {
      "name": "A catchy, professional name for the project.",
      "description": "A one-sentence description of the project for the project list.",
      "tech_stack": ["An array of 4-6 key technologies used."],
      "tagline": "A catchy tagline for the project detail page.",
      "problem_statement": "A clear description of the problem this project solves.",
      "project_goal": "The main objective or goal of the project.",
      "your_role": "A description of your role and responsibilities in the project.",
      "design_decisions": "An explanation of key design and UX choices made, formatted with markdown.",
      "key_features": [{ "title": "Feature Title", "description": "Description of the feature.", "icon": "🚀" }],
      "challenges": "A summary of the main challenges faced during the project, formatted with markdown.",
      "solutions": "How the challenges were overcome, formatted with markdown.",
      "impact_stats": [{ "metric": "User Engagement", "value": "+25%", "description": "Increase in daily active users." }],
      "lessons_learned": "Key takeaways and lessons learned from the project, formatted with markdown.",
      "future_improvements": "Potential future enhancements for the project, formatted with markdown."
    }`
    const userPromptForText = `User Prompt: "${prompt}". Generate the complete project case study.`
    const englishContentJson = await getCompletion(systemPrompt, userPromptForText, true)
    if (!englishContentJson) throw new Error("Failed to generate English content from OpenAI.")
    
    let englishContent;
    try {
      englishContent = JSON.parse(englishContentJson);
      console.log("Successfully parsed JSON from OpenAI.");
    } catch (e) {
      console.error("Failed to parse JSON from OpenAI:", englishContentJson);
      throw new Error("AI returned invalid data format. Please try again.");
    }

    // 2. Generate thumbnail and hero images in parallel
    console.log("Generating thumbnail and hero images...");
    const thumbnailPrompt = `A professional, abstract thumbnail image for a tech project called "${englishContent.name}". Style: minimalist, clean, modern, vibrant gradient. No text in the image.`;
    const heroImagePrompt = `A high-quality, professional hero image for a tech project called "${englishContent.name}" with the tagline "${englishContent.tagline}". Style: abstract, tech, modern, clean. No text in the image.`;
    
    const [thumbnail_url, hero_image_url] = await Promise.all([
      generateAndUploadImage(thumbnailPrompt, englishContent.name, supabaseAdmin, 'project-images'),
      generateAndUploadImage(heroImagePrompt, englishContent.name, supabaseAdmin, 'project-images')
    ]);
    console.log("Thumbnail and hero images generated and uploaded.");

    // 3. Translate all text content in parallel
    console.log("Translating content...");
    const translationPromises = [];
    const fieldsToTranslate = ['name', 'description', 'tagline', 'problem_statement', 'project_goal', 'your_role', 'design_decisions', 'challenges', 'solutions', 'lessons_learned', 'future_improvements'];
    fieldsToTranslate.forEach(field => {
      translationPromises.push(translateText(englishContent[field], 'French'));
      translationPromises.push(translateText(englishContent[field], 'Arabic'));
    });
    (englishContent.key_features || []).forEach(f => {
      translationPromises.push(translateText(f.title, 'French'), translateText(f.title, 'Arabic'));
      translationPromises.push(translateText(f.description, 'French'), translateText(f.description, 'Arabic'));
    });
    (englishContent.impact_stats || []).forEach(s => {
      translationPromises.push(translateText(s.metric, 'French'), translateText(s.metric, 'Arabic'));
      translationPromises.push(translateText(s.description, 'French'), translateText(s.description, 'Arabic'));
    });

    const translations = await Promise.all(translationPromises);
    let tIndex = 0;
    console.log("Translation complete.");

    const translatedData = {};
    fieldsToTranslate.forEach(field => {
      translatedData[field] = { en: englishContent[field], fr: translations[tIndex++], ar: translations[tIndex++] };
    });
    translatedData.key_features = (englishContent.key_features || []).map((f, i) => ({
      title: { en: englishContent.key_features[i].title, fr: translations[tIndex++], ar: translations[tIndex++] },
      description: { en: englishContent.key_features[i].description, fr: translations[tIndex++], ar: translations[tIndex++] },
      icon: f.icon,
      image_url: "", // No image for key features in this version
    }));
    translatedData.impact_stats = (englishContent.impact_stats || []).map(s => ({
      metric: { en: s.metric, fr: translations[tIndex++], ar: translations[tIndex++] },
      description: { en: s.description, fr: translations[tIndex++], ar: translations[tIndex++] },
      value: s.value,
    }));

    // 4. Prepare data for database insertion
    console.log("Preparing data for database insertion...");
    const projectData = {
      name: translatedData.name,
      description: translatedData.description,
      tech_stack: englishContent.tech_stack,
      featured: false,
      stars: Math.floor(Math.random() * 100),
      thumbnail_url: thumbnail_url,
    };

    const { data: newProject, error: insertError } = await supabaseAdmin
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (insertError) throw insertError;
    console.log(`New project created with ID: ${newProject.id}`);

    const projectDetailsData = {
      id: newProject.id,
      hero_image_url: hero_image_url,
      tagline: translatedData.tagline,
      problem_statement: translatedData.problem_statement,
      project_goal: translatedData.project_goal,
      your_role: translatedData.your_role,
      design_decisions: translatedData.design_decisions,
      before_after_images: [], // No before/after images in this version
      key_features: translatedData.key_features,
      challenges: translatedData.challenges,
      solutions: translatedData.solutions,
      impact_stats: translatedData.impact_stats,
      lessons_learned: translatedData.lessons_learned,
      future_improvements: translatedData.future_improvements,
      video_demo_url: "",
    };

    const { error: detailsInsertError } = await supabaseAdmin
      .from('project_details')
      .insert([projectDetailsData]);

    if (detailsInsertError) {
      console.error("Failed to insert project details, rolling back project creation...");
      await supabaseAdmin.from('projects').delete().eq('id', newProject.id);
      throw detailsInsertError;
    }
    console.log("Project details inserted successfully.");

    return new Response(JSON.stringify(newProject), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error("Error in generate-full-project function:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
})