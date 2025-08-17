// Simple test to check if the function works
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// You can test this by running: deno run --allow-net --allow-env test-function.ts
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
  Deno.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Testing blog generation function...')

try {
  const { data, error } = await supabase.functions.invoke('generate-blog-post', {
    body: { topic: 'A simple test blog post about web development' },
  })

  if (error) {
    console.error('Function error:', error)
  } else {
    console.log('Function success!')
    console.log('Data keys:', Object.keys(data || {}))
  }
} catch (err) {
  console.error('Request error:', err)
}
