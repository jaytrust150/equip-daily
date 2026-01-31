/**
 * Rate Limiting Middleware for Vercel Serverless Functions
 * 
 * Implements token bucket algorithm for rate limiting.
 * Uses in-memory storage (suitable for Vercel serverless with request isolation).
 * 
 * Configuration:
 * - requests: Number of requests allowed
 * - windowMs: Time window in milliseconds
 * 
 * Example:
 * const limiter = createRateLimiter({ requests: 10, windowMs: 60000 }); // 10 req/min
 * if (!limiter(clientId)) {
 *   return response.status(429).json({ error: 'Too many requests' });
 * }
 */

// Store for tracking request counts per client
const store = new Map();

/**
 * Create a rate limiter function
 * @param {Object} options - Configuration options
 * @param {number} options.requests - Number of requests allowed per window
 * @param {number} options.windowMs - Time window in milliseconds
 * @returns {Function} Rate limiter function that takes clientId and returns boolean
 */
export function createRateLimiter({ requests = 10, windowMs = 60000 } = {}) {
  return (clientId) => {
    const now = Date.now();
    const key = `${clientId}`;
    
    if (!store.has(key)) {
      // First request from this client
      store.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    const clientData = store.get(key);
    
    // Check if window has expired
    if (now > clientData.resetTime) {
      // Reset the window
      store.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    // Window is still active
    if (clientData.count < requests) {
      clientData.count++;
      store.set(key, clientData);
      return true;
    }
    
    // Rate limit exceeded
    return false;
  };
}

/**
 * Extract client IP address from request
 * @param {Object} request - Vercel request object
 * @returns {string} Client IP address
 */
export function getClientIp(request) {
  // Vercel provides IP in x-forwarded-for header
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers['x-real-ip'] || request.socket?.remoteAddress || 'unknown';
}

/**
 * Create response headers for rate limit info
 * @param {number} remaining - Remaining requests
 * @param {number} reset - Reset time timestamp
 * @returns {Object} Headers object
 */
export function getRateLimitHeaders(remaining, reset) {
  return {
    'X-RateLimit-Limit': '10',
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
  };
}
