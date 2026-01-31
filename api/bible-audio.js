/**
 * Bible Audio API Endpoint
 * 
 * Vercel serverless function to fetch audio URLs from API.Bible.
 * Returns the MP3 audio file URL for a specific Bible chapter.
 * 
 * Query Parameters:
 * @param {string} bibleId - Audio Bible version ID (e.g., '105a06b6146d11e7-01' for WEB Audio)
 * @param {string} chapterId - Full chapter ID in format 'BOOK.CHAPTER' (e.g., 'GEN.1', 'JHN.3')
 * 
 * Response:
 * @returns {Object} { audioUrl: string, data: object } - Audio URL and full API response
 * @returns {Object} Error object if audio not found or request fails
 */
// Vercel Serverless Function: Fetch audio URL from API.Bible
import { createRateLimiter, getClientIp } from './middleware/rateLimiter.js';

// Rate limiter: 40 requests per minute per IP (audio fetch is a lightweight operation)
const limiter = createRateLimiter({ requests: 40, windowMs: 60000 });

export default async function handler(req, res) {
  // Set CORS headers to allow requests from frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Rate limit check
  const clientIp = getClientIp(req);
  if (!limiter(clientIp)) {
    return res.status(429).json({ 
      error: 'Too many requests',
      message: 'Rate limit exceeded. Maximum 40 requests per minute.'
    });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract query parameters
  const { bibleId, chapterId } = req.query;

  // Validate required parameters
  if (!bibleId || !chapterId) {
    return res.status(400).json({ error: 'Missing required parameters: bibleId, chapterId' });
  }

  // Get API key from environment variables
  let apiKey = process.env.BIBLE_API_KEY;
  if (!apiKey && process.env.VITE_BIBLE_API_KEY) {
    apiKey = process.env.VITE_BIBLE_API_KEY;
  }
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing API key' });
  }

  try {
    // Fetch chapter audio metadata from API.Bible audio-bibles endpoint
    const url = `https://rest.api.bible/v1/audio-bibles/${bibleId}/chapters/${chapterId}`;
    const response = await fetch(url, {
      headers: {
        'api-key': apiKey.trim()
      }
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API.Bible audio error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `API error: ${response.status}`,
        message: response.statusText,
        details: errorText,
        unauthorized: response.status === 401 || response.status === 403
      });
    }

    // Parse audio data from API response
    const data = await response.json();
    
    // Extract the audio URL from the response
    // API.Bible returns audio data with resourceUrl containing the MP3 file
    if (data.data && data.data.resourceUrl) {
      // Return the audio URL and full data object
      return res.status(200).json({ 
        audioUrl: data.data.resourceUrl,
        data: data.data 
      });
    } else {
      // Audio URL not found in API response
      return res.status(404).json({ error: 'No audio URL found in response' });
    }

  } catch (error) {
    // Handle network errors or other fetch failures
    console.error('Error fetching audio:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
