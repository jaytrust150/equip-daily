/**
 * Bible Chapter API Endpoint
 * 
 * Serverless function to proxy Bible API requests for chapter content.
 * This keeps the API key secure on the server and avoids CORS issues.
 * 
 * Query Parameters:
 * @param {string} bibleId - Bible version ID (e.g., 'd6e14a625393b4da-01' for NLT)
 * @param {string} bookId - USFM book code (e.g., 'GEN', 'JHN')
 * @param {string} chapter - Chapter number (e.g., '1', '3')
 * 
 * Response:
 * @returns {Object} Chapter data with verses, numbers, and formatting
 * @returns {Object} Error object if request fails
 */
// Serverless function to proxy Bible API requests for chapters
// This keeps your API key secure and avoids CORS issues
/* eslint-disable no-console */
import { createRateLimiter, getClientIp } from './middleware/rateLimiter.js';

// Rate limiter: 30 requests per minute per IP
const limiter = createRateLimiter({ requests: 30, windowMs: 60000 });

export default async function handler(request, response) {
  // Set CORS headers to allow requests from any origin (frontend)
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Rate limit check
  const clientIp = getClientIp(request);
  if (!limiter(clientIp)) {
    return response.status(429).json({ 
      error: 'Too many requests',
      message: 'Rate limit exceeded. Maximum 30 requests per minute.'
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  // Extract and validate required query parameters
  const { bibleId, bookId, chapter } = request.query;

  // Validate required parameters
  if (!bibleId || !bookId || !chapter) {
    return response.status(400).json({ 
      error: 'Missing required parameters: bibleId, bookId, chapter' 
    });
  }

  // Check for API key with fallback support for different env var names
  // Supports both BIBLE_API_KEY (production) and VITE_BIBLE_API_KEY (development)
  let API_KEY = process.env.BIBLE_API_KEY;
  
  if (API_KEY) {
    console.log('Found BIBLE_API_KEY');
  } else if (process.env.VITE_BIBLE_API_KEY) {
    API_KEY = process.env.VITE_BIBLE_API_KEY;
    console.log('Found VITE_BIBLE_API_KEY');
  }
  
  // If no API key found in any env var, return error
  if (!API_KEY) {
    console.error('CRITICAL ERROR: No API Key found');
    return response.status(500).json({ 
      error: 'Server configuration error: Missing API key' 
    });
  }

  try {
    // Build API.Bible URL with query parameters for proper verse parsing
    // These params ensure verses are numbered and formatted correctly
    const params = new URLSearchParams({
      'content-type': 'json', // Return JSON instead of HTML
      'include-verse-numbers': 'true', // Include verse number markers
      'include-titles': 'true', // Include section titles
      'include-chapter-numbers': 'true', // Include chapter numbers
      'include-verse-spans': 'true' // Include verse range spans
    });
    
    // Construct full API endpoint URL
    const url = `https://rest.api.bible/v1/bibles/${bibleId}/chapters/${bookId}.${chapter}?${params}`;
    
    // Fetch chapter data from API.Bible with authentication
    const fetchResponse = await fetch(url, {
      headers: {
        'api-key': API_KEY,
      },
    });

    // Handle non-OK responses (401, 403, 404, etc.)
    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error('API.Bible error:', fetchResponse.status, errorText);
      
      return response.status(fetchResponse.status).json({ 
        error: `API error: ${fetchResponse.status}`,
        message: fetchResponse.statusText,
        unauthorized: fetchResponse.status === 401 || fetchResponse.status === 403
      });
    }

    // Parse and return successful response
    const data = await fetchResponse.json();
    
    // Successfully fetched chapter data - return to client
    return response.status(200).json(data);
    
  } catch (error) {
    // Handle network errors, timeouts, or other fetch failures
    console.error('Bible API proxy error:', error);
    return response.status(500).json({ 
      error: 'Failed to fetch Bible chapter',
      message: error.message 
    });
  }
}
