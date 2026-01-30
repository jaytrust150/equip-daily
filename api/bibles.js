/**
 * Bible Versions List API Endpoint
 * 
 * Serverless function to proxy Bible API requests for available Bible versions.
 * Returns the complete list of Bible translations accessible with the API key.
 * This keeps the API key secure on the server and avoids CORS issues.
 * 
 * No Query Parameters required
 * 
 * Response:
 * @returns {Object} { data: Array } - List of available Bible versions with metadata
 * @returns {Object} Error object if request fails
 * 
 * Each Bible version includes:
 * - id: Bible version ID for API requests
 * - name: Full name (e.g., "New Living Translation")
 * - abbreviation: Short code (e.g., "NLT")
 * - language: Language object with name and code
 * - countries: Array of country objects
 */
// Serverless function to proxy Bible API requests for available Bible versions
// This keeps your API key secure and avoids CORS issues

export default async function handler(request, response) {
  // Set CORS headers to allow requests from any origin
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key with fallback support
  let API_KEY = process.env.BIBLE_API_KEY;
  if (!API_KEY && process.env.VITE_BIBLE_API_KEY) {
    API_KEY = process.env.VITE_BIBLE_API_KEY;
  }

  // Return error if no API key configured
  if (!API_KEY) {
    return response.status(500).json({
      error: 'Server configuration error: Missing API key'
    });
  }

  try {
    // Fetch list of all available Bible versions from API.Bible
    const fetchResponse = await fetch('https://rest.api.bible/v1/bibles', {
      headers: { 'api-key': API_KEY }
    });

    // Handle non-OK responses
    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('API.Bible versions error:', fetchResponse.status, errorText);
      return response.status(fetchResponse.status).json({
        error: `API error: ${fetchResponse.status}`,
        message: fetchResponse.statusText
      });
    }

    // Parse and return Bible versions list
    const data = await fetchResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    // Handle network errors or fetch failures
    console.error('Bible versions proxy error:', error);
    return response.status(500).json({
      error: 'Failed to fetch Bible versions',
      message: error.message
    });
  }
}
