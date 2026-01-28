// Serverless function to proxy Bible API requests for chapters
// This keeps your API key secure and avoids CORS issues

export default async function handler(request, response) {
  // Set CORS headers to allow requests from your frontend
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { bibleId, bookId, chapter } = request.query;

  // Validate required parameters
  if (!bibleId || !bookId || !chapter) {
    return response.status(400).json({ 
      error: 'Missing required parameters: bibleId, bookId, chapter' 
    });
  }

  // Check for API key with fallback support
  let API_KEY = process.env.BIBLE_API_KEY;
  
  if (API_KEY) {
    console.log('Found BIBLE_API_KEY');
  } else if (process.env.VITE_BIBLE_API_KEY) {
    API_KEY = process.env.VITE_BIBLE_API_KEY;
    console.log('Found VITE_BIBLE_API_KEY');
  }
  
  if (!API_KEY) {
    console.error('CRITICAL ERROR: No API Key found');
    return response.status(500).json({ 
      error: 'Server configuration error: Missing API key' 
    });
  }

  try {
    // Build URL with required query parameters for proper verse parsing
    const params = new URLSearchParams({
      'content-type': 'json',
      'include-verse-numbers': 'true',
      'include-titles': 'true',
      'include-chapter-numbers': 'true',
      'include-verse-spans': 'true'
    });
    
    const url = `https://rest.api.bible/v1/bibles/${bibleId}/chapters/${bookId}.${chapter}?${params}`;
    
    const fetchResponse = await fetch(url, {
      headers: {
        'api-key': API_KEY,
      },
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('API.Bible error:', fetchResponse.status, errorText);
      
      return response.status(fetchResponse.status).json({ 
        error: `API error: ${fetchResponse.status}`,
        message: fetchResponse.statusText,
        unauthorized: fetchResponse.status === 401 || fetchResponse.status === 403
      });
    }

    const data = await fetchResponse.json();
    
    // Successfully fetched - return the data
    return response.status(200).json(data);
    
  } catch (error) {
    console.error('Bible API proxy error:', error);
    return response.status(500).json({ 
      error: 'Failed to fetch Bible chapter',
      message: error.message 
    });
  }
}
