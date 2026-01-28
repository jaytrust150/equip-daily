/**
 * Health Check Endpoint for Equip Daily
 * 
 * Verifies system status including:
 * - API key configuration
 * - Bible API connectivity
 * - Environment variables
 * - Authorized Bibles list
 */

export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: {
      environment: null,
      bibleAPI: null,
      authorizedBibles: null
    },
    errors: []
  };

  try {
    // Check 1: Environment Variables
    const apiKey = process.env.VITE_BIBLE_API_KEY || process.env.BIBLE_API_KEY;
    if (!apiKey) {
      healthStatus.checks.environment = {
        status: 'error',
        message: 'Missing VITE_BIBLE_API_KEY or BIBLE_API_KEY'
      };
      healthStatus.errors.push('API key not configured');
    } else {
      healthStatus.checks.environment = {
        status: 'ok',
        message: 'API key is configured',
        keyLength: apiKey.length
      };
    }

    // Check 2: Bible API Connectivity
    try {
      const response = await fetch('https://rest.api.bible/v1/bibles', {
        method: 'GET',
        headers: {
          'api-key': apiKey || 'invalid'
        }
      });

      if (response.ok) {
        const bibleList = await response.json();
        healthStatus.checks.bibleAPI = {
          status: 'ok',
          message: 'API.Bible connectivity verified',
          endpoint: 'https://rest.api.bible/v1/',
          availableBibles: bibleList.data ? bibleList.data.length : 0
        };
      } else if (response.status === 401) {
        healthStatus.checks.bibleAPI = {
          status: 'error',
          message: 'Authentication failed - check API key'
        };
        healthStatus.errors.push('API authentication failed (401)');
      } else if (response.status === 403) {
        healthStatus.checks.bibleAPI = {
          status: 'error',
          message: 'Authorization failed - check API permissions'
        };
        healthStatus.errors.push('API authorization failed (403)');
      } else {
        healthStatus.checks.bibleAPI = {
          status: 'error',
          message: `API returned ${response.status}`,
          statusText: response.statusText
        };
        healthStatus.errors.push(`API error: ${response.status}`);
      }
    } catch (apiError) {
      healthStatus.checks.bibleAPI = {
        status: 'error',
        message: 'Cannot connect to API.Bible',
        error: apiError.message
      };
      healthStatus.errors.push(`API connection failed: ${apiError.message}`);
    }

    // Check 3: Verify Licensed Bibles
    const LICENSED_BIBLES = [
      'd6e14a625393b4da-01', // NLT
      'de4e12af7f28f599-01', // KJV
      '9879dbb7cfe39e4d-01', // WEB
      '1c49f0a0419e4c6b-01', // NKJV
      '65eec8e0b60e656b-01'  // MSG
    ];

    if (apiKey) {
      const verifyPromises = LICENSED_BIBLES.slice(0, 2).map(bibleId =>
        fetch(`https://rest.api.bible/v1/bibles/${bibleId}`, {
          headers: { 'api-key': apiKey }
        }).then(r => ({ bibleId, ok: r.ok, status: r.status }))
          .catch(e => ({ bibleId, ok: false, error: e.message }))
      );

      const results = await Promise.all(verifyPromises);
      const authorized = results.filter(r => r.ok).length;
      
      healthStatus.checks.authorizedBibles = {
        status: authorized > 0 ? 'ok' : 'error',
        message: `${authorized}/${results.length} sampled Bibles accessible`,
        licensed: LICENSED_BIBLES.length,
        verified: authorized
      };

      if (authorized === 0) {
        healthStatus.errors.push('No authorized Bibles accessible');
      }
    } else {
      healthStatus.checks.authorizedBibles = {
        status: 'warning',
        message: 'Skipped - API key not available'
      };
    }

    // Determine overall health status
    const errorCount = healthStatus.errors.length;
    if (errorCount > 0) {
      healthStatus.status = errorCount >= 2 ? 'unhealthy' : 'degraded';
    }

  } catch (error) {
    healthStatus.status = 'unhealthy';
    healthStatus.errors.push(`Unexpected error: ${error.message}`);
  }

  // Return response with appropriate status code
  const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                     healthStatus.status === 'degraded' ? 207 : 
                     503;

  return response.status(httpStatus).json(healthStatus);
}
