// lib/validation.ts
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateCommand = (commandStr: string): ValidationResult => {
  if (!commandStr || typeof commandStr !== 'string') {
    return { isValid: false, error: 'Command cannot be empty' };
  }

  const sanitizedCommandStr = sanitizeString(commandStr);
  const trimmed = sanitizedCommandStr.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Command cannot be empty' };
  }

  if (!trimmed.startsWith('/')) {
    return { isValid: false, error: 'Commands must start with /' };
  }

  return { isValid: true };
};

export const validateSetCommand = (args: string[]): ValidationResult => {
  if (args.length !== 2) {
    return { isValid: false, error: 'Usage: /set [work|break|long] <minutes>' };
  }

  const sanitizedArgs = args.map(sanitizeString);
  const [type, minutesStr] = sanitizedArgs;
  const validTypes = ['work', 'break', 'long'];
  
  if (!validTypes.includes(type.toLowerCase())) {
    return { isValid: false, error: 'Invalid type. Use: work, break, or long' };
  }

  const minutes = parseInt(minutesStr, 10);
  if (isNaN(minutes)) {
    return { isValid: false, error: 'Duration must be a number' };
  }

  if (minutes <= 0) {
    return { isValid: false, error: 'Duration must be greater than 0' };
  }

  if (minutes > 1440) { // 24 hours
    return { isValid: false, error: 'Duration cannot exceed 24 hours (1440 minutes)' };
  }

  return { isValid: true };
};

export const validateSessionName = (name: string): ValidationResult => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Session name cannot be empty' };
  }

  const sanitizedName = sanitizeString(name);
  const trimmed = sanitizedName.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Session name cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Session name cannot exceed 100 characters' };
  }

  return { isValid: true };
};

export const validateCommitMessage = (message: string): ValidationResult => {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Commit message cannot be empty' };
  }

  const sanitizedMessage = sanitizeString(message);
  const trimmed = sanitizedMessage.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Commit message cannot be empty' };
  }

  if (trimmed.length > 500) {
    return { isValid: false, error: 'Commit message cannot exceed 500 characters' };
  }

  return { isValid: true };
};

export const validateTheme = (theme: string): ValidationResult => {
  const validThemes = ['light', 'dark'];
  if (theme) {
    const sanitizedTheme = sanitizeString(theme);
    if (!validThemes.includes(sanitizedTheme.toLowerCase())) {
      return { isValid: false, error: 'Usage: /theme [light|dark] (toggles if no arg)' };
    }
  }
  return { isValid: true };
};

export const validateSound = (sound: string): ValidationResult => {
  const validOptions = ['on', 'off'];
  if (sound) {
    const sanitizedSound = sanitizeString(sound);
    if (!validOptions.includes(sanitizedSound.toLowerCase())) {
      return { isValid: false, error: 'Usage: /sound [on|off] (toggles if no arg)' };
    }
  }
  return { isValid: true };
};

export const validateUserName = (name: string): ValidationResult => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name cannot be empty' };
  }

  const sanitizedName = sanitizeString(name);
  const trimmed = sanitizedName.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Name cannot be empty' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Name cannot exceed 50 characters' };
  }

  // Basic sanitization - only allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true };
};

export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return ''; // Handle non-string inputs gracefully
  // More robust sanitization would involve a library like DOMPurify or a proper HTML escaping function.
  // This is a basic example.
  const tempDiv = document.createElement('div');
  tempDiv.textContent = input;
  return tempDiv.innerHTML;
};