// Serverless function to proxy Bible API search requests
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

  const { bibleId, query, limit = '20' } = request.query;

  // Validate required parameters
  if (!bibleId || !query) {
    return response.status(400).json({ 
      error: 'Missing required parameters: bibleId, query' 
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
    const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    
    const fetchResponse = await fetch(url, {
      headers: {
        'api-key': API_KEY,
      },
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('API.Bible search error:', fetchResponse.status, errorText);
      
      return response.status(fetchResponse.status).json({ 
        error: `API error: ${fetchResponse.status}`,
        message: fetchResponse.statusText,
        unauthorized: fetchResponse.status === 401
      });
    }

    const data = await fetchResponse.json();
    
    // Successfully fetched - return the data
    return response.status(200).json(data);
    
  } catch (error) {
    console.error('Bible search proxy error:', error);
    return response.status(500).json({ 
      error: 'Failed to search Bible',
      message: error.message 
    });
  }
}
