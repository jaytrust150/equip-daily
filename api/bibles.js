// Serverless function to proxy Bible API requests for available Bible versions
// This keeps your API key secure and avoids CORS issues

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  let API_KEY = process.env.BIBLE_API_KEY;
  if (!API_KEY && process.env.VITE_BIBLE_API_KEY) {
    API_KEY = process.env.VITE_BIBLE_API_KEY;
  }

  if (!API_KEY) {
    return response.status(500).json({
      error: 'Server configuration error: Missing API key'
    });
  }

  try {
    const fetchResponse = await fetch('https://rest.api.bible/v1/bibles', {
      headers: { 'api-key': API_KEY }
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('API.Bible versions error:', fetchResponse.status, errorText);
      return response.status(fetchResponse.status).json({
        error: `API error: ${fetchResponse.status}`,
        message: fetchResponse.statusText
      });
    }

    const data = await fetchResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    console.error('Bible versions proxy error:', error);
    return response.status(500).json({
      error: 'Failed to fetch Bible versions',
      message: error.message
    });
  }
}
