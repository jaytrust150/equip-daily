// Vercel Serverless Function: Fetch audio URL from API.Bible
export default async function handler(req, res) {
  const { bibleId, chapterId } = req.query;

  if (!bibleId || !chapterId) {
    return res.status(400).json({ error: 'Missing bibleId or chapterId parameter' });
  }

  const apiKey = process.env.VITE_BIBLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Fetch chapter audio from API.Bible
    const url = `https://rest.api.bible/v1/audio-bibles/${bibleId}/chapters/${chapterId}`;
    const response = await fetch(url, {
      headers: {
        'api-key': apiKey.trim()
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API.Bible audio error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to fetch audio',
        details: errorText 
      });
    }

    const data = await response.json();
    
    // Extract the audio URL from the response
    // API.Bible returns audio data with resourceUrl containing the MP3
    if (data.data && data.data.resourceUrl) {
      return res.status(200).json({ 
        audioUrl: data.data.resourceUrl,
        data: data.data 
      });
    } else {
      return res.status(404).json({ error: 'No audio URL found in response' });
    }

  } catch (error) {
    console.error('Error fetching audio:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
