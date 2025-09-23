import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getSecureEnvConfig } from '../config/secureEnv';

// JWT token types
export interface JWTPayload {
  userId: string;
  role: 'student' | 'company' | 'admin' | 'master_admin';
  email: string;
  sessionId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
  jti?: string; // JWT ID for token tracking
}

// Token options
interface TokenOptions {
  expiresIn?: string;
  audience?: string;
  issuer?: string;
  subject?: string;
  notBefore?: string;
}

// Secure JWT configuration
class SecureJWTService {
  private static jwtConfig: {
    secret: string;
    algorithm: jwt.Algorithm;
    issuer: string;
    audience: string;
    defaultExpiresIn: string;
  };

  // Initialize JWT configuration with security validation
  static initialize(): void {
    const env = getSecureEnvConfig();
    
    // Validate JWT secret strength
    if (env.JWT_SECRET.length < 32) {
      throw new Error('JWT secret must be at least 32 characters for security');
    }

    // Additional security checks for production
    if (env.NODE_ENV === 'production') {
      if (env.JWT_SECRET.length < 64) {
        console.warn('⚠️  JWT secret should be at least 64 characters in production');
      }

      // Check for weak/default secrets
      const weakSecrets = [
        'secret', 'your-jwt-secret', 'development-secret', 'test-secret'
      ];
      
      if (weakSecrets.some(weak => env.JWT_SECRET.toLowerCase().includes(weak))) {
        throw new Error('JWT secret appears to be a default/weak value in production');
      }
    }

    this.jwtConfig = {
      secret: env.JWT_SECRET,
      algorithm: 'HS256', // Use HMAC SHA-256 for security
      issuer: 'apprenticeapex-api',
      audience: 'apprenticeapex-users',
      defaultExpiresIn: env.JWT_EXPIRES_IN || '24h',
    };

    console.log('🔐 Secure JWT service initialized');
  }

  // Generate secure JWT token
  static generateToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>, options: TokenOptions = {}): string {
    if (!this.jwtConfig) {
      this.initialize();
    }

    // Generate unique JWT ID for token tracking
    const jti = crypto.randomBytes(16).toString('hex');
    
    // Generate session ID if not provided
    const sessionId = payload.sessionId || crypto.randomBytes(16).toString('hex');

    const tokenPayload: JWTPayload = {
      ...payload,
      sessionId,
      jti,
    };

    const tokenOptions: jwt.SignOptions = {
      algorithm: this.jwtConfig.algorithm,
      expiresIn: (options.expiresIn || this.jwtConfig.defaultExpiresIn) as any,
      issuer: options.issuer || this.jwtConfig.issuer,
      audience: options.audience || this.jwtConfig.audience,
      subject: options.subject || payload.userId,
      notBefore: (options.notBefore as any),
      jwtid: jti,
    };

    try {
      const token = jwt.sign(tokenPayload, this.jwtConfig.secret, tokenOptions);
      console.log(`🔐 JWT token generated for user ${payload.userId} (${payload.role})`);
      return token;
    } catch (error) {
      console.error('❌ JWT token generation failed:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  // Verify and decode JWT token
  static verifyToken(token: string, options: { 
    audience?: string; 
    issuer?: string;
    ignoreExpiration?: boolean;
  } = {}): JWTPayload {
    if (!this.jwtConfig) {
      this.initialize();
    }

    if (!token) {
      throw new Error('No token provided');
    }

    // Remove Bearer prefix if present
    const cleanToken = token.replace(/^Bearer\s+/, '');

    const verifyOptions: jwt.VerifyOptions = {
      algorithms: [this.jwtConfig.algorithm],
      audience: options.audience || this.jwtConfig.audience,
      issuer: options.issuer || this.jwtConfig.issuer,
      ignoreExpiration: options.ignoreExpiration || false,
    };

    try {
      const decoded = jwt.verify(cleanToken, this.jwtConfig.secret, verifyOptions) as JWTPayload;
      
      // Additional security validations
      this.validateTokenPayload(decoded);
      
      console.log(`🔐 JWT token verified for user ${decoded.userId} (${decoded.role})`);
      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        console.warn(`🚨 Invalid JWT token: ${error.message}`);
        throw new Error('Invalid authentication token');
      } else if (error instanceof jwt.TokenExpiredError) {
        console.warn('🚨 JWT token expired');
        throw new Error('Authentication token expired');
      } else if (error instanceof jwt.NotBeforeError) {
        console.warn('🚨 JWT token not active yet');
        throw new Error('Authentication token not yet active');
      } else {
        console.error('❌ JWT verification failed:', error);
        throw new Error('Token verification failed');
      }
    }
  }

  // Decode token without verification (for debugging)
  static decodeToken(token: string): JWTPayload | null {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '');
      return jwt.decode(cleanToken) as JWTPayload;
    } catch (error) {
      console.error('❌ JWT decode failed:', error);
      return null;
    }
  }

  // Validate token payload structure and content
  private static validateTokenPayload(payload: JWTPayload): void {
    const requiredFields = ['userId', 'role', 'email'];
    const missingFields = requiredFields.filter(field => !payload[field as keyof JWTPayload]);
    
    if (missingFields.length > 0) {
      throw new Error(`Invalid token payload: missing fields ${missingFields.join(', ')}`);
    }

    // Validate role
    const validRoles = ['student', 'company', 'admin', 'master_admin'];
    if (!validRoles.includes(payload.role)) {
      throw new Error(`Invalid role in token: ${payload.role}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      throw new Error('Invalid email format in token');
    }

    // Validate userId format (should be non-empty string)
    if (typeof payload.userId !== 'string' || payload.userId.length === 0) {
      throw new Error('Invalid userId in token');
    }
  }

  // Refresh token (generate new token with updated expiration)
  static refreshToken(currentToken: string, newExpiresIn?: string): string {
    const decoded = this.verifyToken(currentToken, { ignoreExpiration: true });
    
    // Remove timing-related fields for refresh
    const { iat, exp, jti, ...payloadWithoutTiming } = decoded;
    
    return this.generateToken(payloadWithoutTiming, {
      expiresIn: newExpiresIn || this.jwtConfig.defaultExpiresIn
    });
  }

  // Check if token is expired without throwing
  static isTokenExpired(token: string): boolean {
    try {
      this.verifyToken(token);
      return false;
    } catch (error) {
      if (error instanceof Error && error.message.includes('expired')) {
        return true;
      }
      // If it's another error, token is invalid but not necessarily expired
      return false;
    }
  }

  // Get token expiration time
  static getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  }

  // Generate secure session ID
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Validate token signature without full verification
  static isValidSignature(token: string): boolean {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '');
      jwt.verify(cleanToken, this.jwtConfig.secret, { ignoreExpiration: true });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Generate admin token with elevated permissions
  static generateAdminToken(
    userId: string, 
    email: string, 
    permissions: string[] = [],
    isMasterAdmin: boolean = false
  ): string {
    const role = isMasterAdmin ? 'master_admin' : 'admin';
    
    return this.generateToken({
      userId,
      email,
      role,
      permissions,
      sessionId: this.generateSessionId()
    }, {
      expiresIn: '8h', // Shorter expiration for admin tokens
    });
  }

  // Blacklist management (for token revocation)
  private static blacklistedTokens = new Set<string>();

  static blacklistToken(jti: string): void {
    this.blacklistedTokens.add(jti);
    console.log(`🔐 Token blacklisted: ${jti}`);
  }

  static isTokenBlacklisted(jti: string): boolean {
    return this.blacklistedTokens.has(jti);
  }

  static verifyTokenNotBlacklisted(token: string): JWTPayload {
    const decoded = this.verifyToken(token);
    
    if (decoded.jti && this.isTokenBlacklisted(decoded.jti)) {
      throw new Error('Token has been revoked');
    }
    
    return decoded;
  }

  // Security audit information
  static getSecurityInfo(): {
    algorithm: string;
    keyStrength: number;
    issuer: string;
    audience: string;
    defaultExpiration: string;
  } {
    if (!this.jwtConfig) {
      this.initialize();
    }

    return {
      algorithm: this.jwtConfig.algorithm,
      keyStrength: this.jwtConfig.secret.length,
      issuer: this.jwtConfig.issuer,
      audience: this.jwtConfig.audience,
      defaultExpiration: this.jwtConfig.defaultExpiresIn,
    };
  }
}

// Initialize on module load
SecureJWTService.initialize();

// Export convenience functions
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>, options?: TokenOptions) =>
  SecureJWTService.generateToken(payload, options);

export const verifyToken = (token: string, options?: { audience?: string; issuer?: string }) =>
  SecureJWTService.verifyToken(token, options);

export const refreshToken = (currentToken: string, newExpiresIn?: string) =>
  SecureJWTService.refreshToken(currentToken, newExpiresIn);

export const isTokenExpired = (token: string) =>
  SecureJWTService.isTokenExpired(token);

export const generateAdminToken = (userId: string, email: string, permissions?: string[], isMasterAdmin?: boolean) =>
  SecureJWTService.generateAdminToken(userId, email, permissions, isMasterAdmin);

export const blacklistToken = (jti: string) =>
  SecureJWTService.blacklistToken(jti);

export const verifyTokenNotBlacklisted = (token: string) =>
  SecureJWTService.verifyTokenNotBlacklisted(token);

export const getTokenExpiration = (token: string) =>
  SecureJWTService.getTokenExpiration(token);

export const decodeToken = (token: string) =>
  SecureJWTService.decodeToken(token);

// Export the service class
export { SecureJWTService };
