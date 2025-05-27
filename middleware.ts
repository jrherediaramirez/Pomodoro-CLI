// middleware.ts - Security middleware
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

function getClientIP(request: NextRequest): string {
  // Try multiple headers to get the real client IP
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-vercel-forwarded-for', // Vercel
    'x-client-ip',
    'x-cluster-client-ip'
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }

  return 'unknown';
}

function getRateLimitKey(request: NextRequest): string {
  // Use IP address and user agent for rate limiting
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent.slice(0, 50)}`; // Limit user agent length
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

// Security headers
const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; frame-src 'none'; object-src 'none'; base-uri 'self';",
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting
  const rateLimitKey = getRateLimitKey(request);
  if (isRateLimited(rateLimitKey)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60', // 1 minute
        ...securityHeaders, 
      },
    });
  }
  // Block suspicious requests (but be more lenient for legitimate traffic)
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousPatterns = [
    /\bbot\b/i,
    /\bcrawler\b/i,
    /\bspider\b/i,
    /\bscraper\b/i,
    /\bcurl\b/i,
    /\bwget\b/i,
    /\bpython-requests\b/i,
    /\bgo-http-client\b/i,
  ];

  // Allow legitimate bots and browsers
  const allowedPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /chrome/i,
    /firefox/i,
    /safari/i,
    /edge/i,
    /opera/i,
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  const isAllowed = allowedPatterns.some(pattern => pattern.test(userAgent));

  if (isSuspicious && !isAllowed && userAgent.length < 20) { // Very short user agents are suspicious
    return new NextResponse('Forbidden', {
      status: 403,
      headers: securityHeaders,
    });
  }

  // Validate request size
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
    return new NextResponse('Request Entity Too Large', {
      status: 413,
      headers: securityHeaders,
    });
  }

  // Log security events for analysis
  if (process.env.NODE_ENV === 'production') {
    console.log(`Request: ${request.method} ${request.url} from ${getRateLimitKey(request)}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - fonts (font files)
     * - api routes are included for rate limiting
     */
    '/((?!_next/static|_next/image|favicon.ico|fonts).*)',
  ],
};
