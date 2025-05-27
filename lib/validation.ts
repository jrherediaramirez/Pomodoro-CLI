// lib/validation.ts - Secure input sanitization
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Secure sanitization without DOM manipulation
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove control characters and trim
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>'"&]/g, (char) => {  // Escape HTML special characters
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[char] || char;
    })
    .trim()
    .slice(0, 1000); // Limit length to prevent DoS
};

// Enhanced command validation with stricter rules
export const validateCommand = (commandStr: string): ValidationResult => {
  if (!commandStr || typeof commandStr !== 'string') {
    return { isValid: false, error: 'Command cannot be empty' };
  }

  // Length check to prevent DoS
  if (commandStr.length > 500) {
    return { isValid: false, error: 'Command too long' };
  }

  const sanitizedCommandStr = sanitizeString(commandStr);
  const trimmed = sanitizedCommandStr.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Command cannot be empty' };
  }

  if (!trimmed.startsWith('/')) {
    return { isValid: false, error: 'Commands must start with /' };
  }

  // Validate command structure
  const commandPattern = /^\/[a-zA-Z][a-zA-Z0-9-]*(\s.*)?$/;
  if (!commandPattern.test(trimmed)) {
    return { isValid: false, error: 'Invalid command format' };
  }

  return { isValid: true };
};

// Rate limiting helper
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

export const commandRateLimiter = new RateLimiter(20, 60000); // 20 commands per minute

export const validateSetCommand = (args: string[]): ValidationResult => {
  // Add your validation logic for the /set command here
  // For example, check if args[0] is 'work', 'break', or 'long'
  // and if args[1] is a valid number.
  if (args.length !== 2) {
    return { isValid: false, error: 'Usage: /set [work|break|long] <minutes>' };
  }
  const type = args[0].toLowerCase();
  const minutes = parseInt(args[1], 10);
  if (!['work', 'break', 'long'].includes(type)) {
    return { isValid: false, error: "Invalid type. Use 'work', 'break', or 'long'." };
  }
  if (isNaN(minutes) || minutes <= 0) {
    return { isValid: false, error: 'Minutes must be a positive number.' };
  }
  if (minutes > 1440) { // Example: Max 24 hours
    return { isValid: false, error: 'Duration cannot exceed 1440 minutes.' };
  }
  return { isValid: true };
};

export const validateSessionName = (name: string): ValidationResult => {
  // Add your validation logic for session names here
  const sanitizedName = sanitizeString(name);
  if (!sanitizedName || sanitizedName.trim().length === 0) {
    return { isValid: false, error: 'Session name cannot be empty.' };
  }
  if (sanitizedName.trim().length > 100) {
    return { isValid: false, error: 'Session name cannot exceed 100 characters.' };
  }
  return { isValid: true };
};

export const validateCommitMessage = (message: string): ValidationResult => {
  // Add your validation logic for commit messages here
  const sanitizedMessage = sanitizeString(message);
  if (!sanitizedMessage || sanitizedMessage.trim().length === 0) {
    return { isValid: false, error: 'Commit message cannot be empty.' };
  }
  if (sanitizedMessage.trim().length > 500) {
    return { isValid: false, error: 'Commit message cannot exceed 500 characters.' };
  }
  return { isValid: true };
};

export const validateTheme = (theme: string): ValidationResult => {
  // Add your validation logic for themes here
  const sanitizedTheme = sanitizeString(theme);
  const validThemes = ['light', 'dark'];
  if (sanitizedTheme && !validThemes.includes(sanitizedTheme.toLowerCase())) {
    return { isValid: false, error: "Invalid theme. Use 'light' or 'dark'." };
  }
  return { isValid: true };
};

export const validateSound = (soundOption: string): ValidationResult => {
  // Add your validation logic for sound options here
  const sanitizedSoundOption = sanitizeString(soundOption);
  const validOptions = ['on', 'off'];
  if (sanitizedSoundOption && !validOptions.includes(sanitizedSoundOption.toLowerCase())) {
    return { isValid: false, error: "Invalid sound option. Use 'on' or 'off'." };
  }
  return { isValid: true };
};