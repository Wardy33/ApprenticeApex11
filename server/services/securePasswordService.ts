import bcrypt from 'bcryptjs';
import { getSecureEnvConfig } from '../config/secureEnv';

// Secure password hashing configuration
const PRODUCTION_SALT_ROUNDS = 12; // High security for production
const DEVELOPMENT_SALT_ROUNDS = 10; // Faster for development

interface PasswordValidationRules {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// Default password validation rules
const DEFAULT_PASSWORD_RULES: PasswordValidationRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for user experience
};

// Admin password rules (more strict)
const ADMIN_PASSWORD_RULES: PasswordValidationRules = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

export class SecurePasswordService {
  private static saltRounds: number;

  // Initialize with environment-specific salt rounds
  static initialize(): void {
    const env = getSecureEnvConfig();
    this.saltRounds = env.NODE_ENV === 'production' 
      ? PRODUCTION_SALT_ROUNDS 
      : DEVELOPMENT_SALT_ROUNDS;
    
    console.log(`�� Password service initialized with ${this.saltRounds} salt rounds`);
  }

  // Hash password with secure salt rounds
  static async hashPassword(password: string, isAdmin: boolean = false): Promise<string> {
    if (!this.saltRounds) {
      this.initialize();
    }

    // Validate password strength
    this.validatePasswordStrength(password, isAdmin);

    try {
      const hash = await bcrypt.hash(password, this.saltRounds);
      console.log(`🔐 Password hashed successfully (${this.saltRounds} rounds)`);
      return hash;
    } catch (error) {
      console.error('❌ Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  // Verify password against hash
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!password || !hashedPassword) {
      return false;
    }

    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      console.log(`🔐 Password verification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
      return isValid;
    } catch (error) {
      console.error('❌ Password verification failed:', error);
      return false;
    }
  }

  // Validate password strength
  static validatePasswordStrength(password: string, isAdmin: boolean = false): void {
    const rules = isAdmin ? ADMIN_PASSWORD_RULES : DEFAULT_PASSWORD_RULES;
    const errors: string[] = [];

    // Check minimum length
    if (password.length < rules.minLength) {
      errors.push(`Password must be at least ${rules.minLength} characters long`);
    }

    // Check uppercase requirement
    if (rules.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check lowercase requirement
    if (rules.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check numbers requirement
    if (rules.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check special characters requirement
    if (rules.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    const weakPatterns = [
      /^password/i,
      /^123456/,
      /^qwerty/i,
      /^admin/i,
      /^test/i,
      /(.)\1{2,}/, // Three or more repeated characters
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common weak patterns');
        break;
      }
    }

    if (errors.length > 0) {
      throw new Error(`Password validation failed: ${errors.join(', ')}`);
    }
  }

  // Check if password needs rehashing (upgrade from older rounds)
  static async needsRehashing(hashedPassword: string): Promise<boolean> {
    if (!this.saltRounds) {
      this.initialize();
    }

    try {
      // Check if the hash was created with fewer rounds than current standard
      const currentRounds = this.saltRounds;
      
      // Extract rounds from hash (bcrypt hash format: $2b$rounds$salt+hash)
      const hashParts = hashedPassword.split('$');
      if (hashParts.length < 4) {
        return true; // Invalid hash format, needs rehashing
      }

      const hashRounds = parseInt(hashParts[2], 10);
      return hashRounds < currentRounds;
    } catch (error) {
      console.error('❌ Error checking hash rounds:', error);
      return true; // Err on the side of caution
    }
  }

  // Generate secure random password
  static generateSecurePassword(length: number = 16, includeSpecialChars: boolean = true): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charset = lowercase + uppercase + numbers;
    if (includeSpecialChars) {
      charset += specialChars;
    }

    let password = '';
    
    // Ensure at least one character from each required set
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    if (includeSpecialChars) {
      password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Get password strength score (0-100)
  static getPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    level: 'weak' | 'fair' | 'good' | 'strong';
  } {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 20;
    else feedback.push('Use at least 8 characters');

    if (password.length >= 12) score += 10;
    else if (password.length >= 8) feedback.push('Consider using 12+ characters for better security');

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 15;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
    else feedback.push('Add special characters');

    // Pattern checks
    if (!/(.)\1{2,}/.test(password)) score += 10;
    else feedback.push('Avoid repeated characters');

    if (!/^(.+)(.+)\1$/.test(password)) score += 10;
    else feedback.push('Avoid predictable patterns');

    // Determine level
    let level: 'weak' | 'fair' | 'good' | 'strong';
    if (score >= 80) level = 'strong';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'fair';
    else level = 'weak';

    return { score, feedback, level };
  }

  // Secure password comparison with timing attack protection
  static async secureCompare(password: string, hashedPassword: string): Promise<boolean> {
    // Use constant-time comparison to prevent timing attacks
    const result = await this.verifyPassword(password, hashedPassword);
    
    // Add random delay to make timing attacks harder
    const randomDelay = Math.floor(Math.random() * 50) + 10; // 10-60ms
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    
    return result;
  }
}

// Initialize on module load
SecurePasswordService.initialize();

// Export convenience functions
export const hashPassword = (password: string, isAdmin?: boolean) => 
  SecurePasswordService.hashPassword(password, isAdmin);

export const verifyPassword = (password: string, hashedPassword: string) => 
  SecurePasswordService.verifyPassword(password, hashedPassword);

export const validatePasswordStrength = (password: string, isAdmin?: boolean) => 
  SecurePasswordService.validatePasswordStrength(password, isAdmin);

export const generateSecurePassword = (length?: number, includeSpecialChars?: boolean) => 
  SecurePasswordService.generateSecurePassword(length, includeSpecialChars);

export const getPasswordStrength = (password: string) => 
  SecurePasswordService.getPasswordStrength(password);

export const needsRehashing = (hashedPassword: string) => 
  SecurePasswordService.needsRehashing(hashedPassword);
