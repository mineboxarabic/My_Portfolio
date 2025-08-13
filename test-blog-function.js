// Simple test for the blog generation function
const testFunction = async () => {
  try {
    console.log('Testing blog generation function...');
    
    const response = await fetch('https://nrqbqrextfpjoogovizh.supabase.co/functions/v1/generate-blog-post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycWJxcmV4dGZwam9vZ292aXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTk4ODYsImV4cCI6MjA2OTM5NTg4Nn0.cbPY27ns13AosNpSKT1EY4A4ungbHW9n827Z3zyLfCo`,
      },
      body: JSON.stringify({
        topic: 'A simple test blog post about web development'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Success! Generated data:', data);

  } catch (error) {
    console.error('Test failed:', error);
  }
};

testFunction();
