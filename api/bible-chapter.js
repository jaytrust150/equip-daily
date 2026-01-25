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

  const API_KEY = process.env.BIBLE_API_KEY;
  
  if (!API_KEY) {
    console.error('BIBLE_API_KEY not configured');
    return response.status(500).json({ 
      error: 'Server configuration error: Missing API key' 
    });
  }

  try {
    const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/chapters/${bookId}.${chapter}?content-type=json`;
    
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
        unauthorized: fetchResponse.status === 401
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
