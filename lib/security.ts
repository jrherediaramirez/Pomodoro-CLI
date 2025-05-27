// lib/security.ts - Secure error handling and logging
export interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'invalid_input' | 'unauthorized_access';
  userId?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  details: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;

  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.push(securityEvent);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log critical events to console (in production, send to security monitoring)
    if (event.type === 'unauthorized_access' || event.type === 'auth_failure') {
      console.warn('Security Event:', securityEvent);
    }
  }

  getRecentEvents(count = 10): SecurityEvent[] {
    return this.events.slice(-count);
  }

  // In production, this would send to your security monitoring service
  async reportSuspiciousActivity(event: SecurityEvent): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      // Send to security monitoring service
      console.error('SECURITY ALERT:', event);
    }
  }
}

export const securityLogger = new SecurityLogger();

// Secure error sanitization
export const sanitizeError = (error: unknown): string => {
  if (error instanceof Error) {
    // Remove sensitive information from error messages
    let message = error.message;
    
    // Remove file paths
    message = message.replace(/\/[^\s]+/g, '[PATH_REMOVED]');
    
    // Remove potential sensitive data patterns
    message = message.replace(/\b\w+@\w+\.\w+\b/g, '[EMAIL_REMOVED]');
    message = message.replace(/\b\d{4,}\b/g, '[NUMBER_REMOVED]');
    message = message.replace(/[a-zA-Z0-9]{20,}/g, '[TOKEN_REMOVED]');
    
    return message;
  }
  
  return 'An unknown error occurred';
};

// Content Security Policy configuration
export const getCSPHeader = (): string => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ];
  
  return csp.join('; ');
};

// Input validation middleware
export const validateUserInput = (input: any, schema: any): boolean => {
  try {
    // Basic validation - in production use a proper schema validator like Zod
    if (typeof input !== 'object' || input === null) return false;
    
    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in input)) return false;
      if (typeof input[key] !== expectedType) return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Session security
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
  private static readonly ACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  static isSessionValid(lastActivity: Date): boolean {
    const now = new Date();
    const sessionAge = now.getTime() - lastActivity.getTime();
    return sessionAge < this.SESSION_TIMEOUT;
  }

  static shouldRefreshSession(lastActivity: Date): boolean {
    const now = new Date();
    const inactiveTime = now.getTime() - lastActivity.getTime();
    return inactiveTime > this.ACTIVITY_THRESHOLD;
  }

  static generateSecureHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': getCSPHeader()
    };
  }
}

// Data encryption helpers (for sensitive local storage)
export class DataEncryption {
  private static readonly algorithm = 'AES-GCM';
  private static readonly keyLength = 256;

  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataArray = encoder.encode(data);
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        key,
        dataArray
      );

      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        details: 'Encryption failed'
      });
      throw new Error('Encryption failed');
    }
  }

  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv,
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      securityLogger.log({
        type: 'unauthorized_access',
        details: 'Decryption failed'
      });
      throw new Error('Decryption failed');
    }
  }
}