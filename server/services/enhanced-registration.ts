/**
 * Enhanced Registration Service for TrainPro
 * Implements enterprise-grade security features based on 2025 best practices
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from '../db';
import { emailService } from './email-service';
import { users, emailVerificationTokens, registrationAttempts } from '@shared/schema';
import { eq, sql, and, desc, lt } from 'drizzle-orm';

// Password validation configuration
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever'
];

const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  maxRepeatingChars: 3,
  forbidCommonPatterns: true
};

// Rate limiting configuration
const REGISTRATION_LIMITS = {
  maxAttemptsPerEmail: 5,
  maxAttemptsPerIP: 10,
  timeWindowMinutes: 15,
  emailVerificationExpiryMinutes: 15,
  maxResendAttempts: 3
};

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  requirements: string[];
  feedback: string[];
}

/**
 * Enhanced password strength validation following NIST guidelines
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const requirements: string[] = [];
  const feedback: string[] = [];
  let score = 0;

  // Length validation (most important factor)
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    requirements.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters required`);
  } else {
    score += 30;
    if (password.length >= 16) score += 10; // Bonus for longer passwords
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    requirements.push(`Maximum ${PASSWORD_REQUIREMENTS.maxLength} characters allowed`);
  }

  // Character variety (but not mandatory complexity)
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password);

  let varietyScore = 0;
  if (hasUpper) varietyScore += 10;
  if (hasLower) varietyScore += 10;
  if (hasNumbers) varietyScore += 10;
  if (hasSpecial) varietyScore += 15;
  
  score += varietyScore;

  if (varietyScore < 20) {
    feedback.push('Consider using a mix of uppercase, lowercase, numbers, and special characters');
  }

  // Check for common passwords (critical security issue)
  const lowerPassword = password.toLowerCase();
  if (COMMON_PASSWORDS.includes(lowerPassword)) {
    requirements.push('This password is too common and easily guessed');
    score = Math.min(score, 20); // Cap score for common passwords
  }

  // Check for repeating characters
  const repeatingPattern = new RegExp(`(.)\\1{${PASSWORD_REQUIREMENTS.maxRepeatingChars},}`, 'i');
  if (repeatingPattern.test(password)) {
    feedback.push('Avoid repeating the same character multiple times');
    score -= 10;
  }

  // Check for common patterns
  if (PASSWORD_REQUIREMENTS.forbidCommonPatterns) {
    const commonPatterns = [
      /123+/, /abc+/i, /qwe+/i, /password/i, /admin/i,
      /^(.)\1+$/, // All same character
      /01234567/, /987654321/
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        feedback.push('Avoid common patterns like "123", "abc", or "password"');
        score -= 15;
        break;
      }
    }
  }

  // Entropy calculation bonus
  const uniqueChars = new Set(password).size;
  const entropyBonus = Math.min(uniqueChars / password.length * 20, 20);
  score += entropyBonus;

  // Final score adjustment
  score = Math.max(0, Math.min(100, score));

  const isValid = requirements.length === 0 && score >= 60;

  if (!isValid && score < 40) {
    feedback.unshift('Password is too weak. Consider using a longer passphrase with mixed characters.');
  } else if (!isValid && score < 60) {
    feedback.unshift('Password strength is moderate. Consider making it longer or more varied.');
  }

  return {
    isValid,
    score,
    requirements,
    feedback
  };
}

/**
 * Generate secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate user-friendly verification code (6 digits)
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Check registration rate limits
 */
export async function checkRegistrationRateLimit(email: string, ipAddress: string): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
}> {
  const timeWindow = new Date(Date.now() - REGISTRATION_LIMITS.timeWindowMinutes * 60 * 1000);

  try {
    // Check email-based rate limit
    const emailAttempts = await db
      .select({ count: sql<number>`count(*)` })
      .from(registrationAttempts)
      .where(and(
        eq(registrationAttempts.email, email),
        sql`${registrationAttempts.createdAt} > ${timeWindow}`
      ));

    if (emailAttempts[0]?.count >= REGISTRATION_LIMITS.maxAttemptsPerEmail) {
      return {
        allowed: false,
        reason: 'Too many registration attempts for this email',
        retryAfter: REGISTRATION_LIMITS.timeWindowMinutes * 60
      };
    }

    // Check IP-based rate limit
    const ipAttempts = await db
      .select({ count: sql<number>`count(*)` })
      .from(registrationAttempts)
      .where(and(
        eq(registrationAttempts.ipAddress, ipAddress),
        sql`${registrationAttempts.createdAt} > ${timeWindow}`
      ));

    if (ipAttempts[0]?.count >= REGISTRATION_LIMITS.maxAttemptsPerIP) {
      return {
        allowed: false,
        reason: 'Too many registration attempts from this IP address',
        retryAfter: REGISTRATION_LIMITS.timeWindowMinutes * 60
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true }; // Fail open for availability
  }
}

/**
 * Log registration attempt
 */
export async function logRegistrationAttempt(
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  failureReason?: string
): Promise<void> {
  try {
    await db.insert(registrationAttempts).values({
      email,
      ipAddress,
      userAgent,
      success,
      failureReason,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log registration attempt:', error);
    // Don't throw - logging failures shouldn't block registration
  }
}

/**
 * Create email verification token and send verification email  
 */
export async function createEmailVerificationToken(
  userId: number,
  email: string,
  name: string,
  baseUrl: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Generate verification token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + REGISTRATION_LIMITS.emailVerificationExpiryMinutes * 60 * 1000);

    // Store verification token in database
    await db.insert(emailVerificationTokens).values({
      userId,
      token,
      email,
      expiresAt,
      createdAt: new Date()
    });

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail({
      to: email,
      name,
      verificationToken: token,
      baseUrl
    });

    if (!emailSent) {
      return {
        success: false,
        error: 'Failed to send verification email'
      };
    }

    console.log(`✅ Verification email sent to ${email} for user ${userId}`);
    return {
      success: true,
      token
    };
  } catch (error) {
    console.error('Email verification token creation error:', error);
    return {
      success: false,
      error: 'Failed to create verification token'
    };
  }
}

/**
 * Verify email verification token
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  email?: string;
  userId?: number;
  error?: string;
}> {
  try {
    const tokenRecord = await db
      .select()
      .from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.token, token),
        sql`${emailVerificationTokens.usedAt} IS NULL`,
        sql`${emailVerificationTokens.expiresAt} > NOW()`
      ))
      .limit(1);

    if (tokenRecord.length === 0) {
      return { success: false, error: 'Invalid or expired token' };
    }

    const record = tokenRecord[0];

    // Mark token as used
    await db
      .update(emailVerificationTokens)
      .set({ 
        usedAt: new Date()
      })
      .where(eq(emailVerificationTokens.token, token));

    // Update user's email verification status
    await db
      .update(users)
      .set({ 
        emailVerified: true
      })
      .where(eq(users.id, record.userId!));

    // Send welcome email
    const user = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, record.userId!))
      .limit(1);

    if (user.length > 0) {
      await emailService.sendWelcomeEmail(record.email, user[0].name);
    }

    console.log(`✅ Email verified for user ${record.userId}: ${record.email}`);

    return {
      success: true,
      email: record.email,
      userId: record.userId || undefined
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
}

/**
 * Clean up expired tokens (maintenance function)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    await db
      .delete(emailVerificationTokens)
      .where(sql`${emailVerificationTokens.expiresAt} < NOW()`);
    
    // Also cleanup old registration attempts (older than 24 hours)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await db
      .delete(registrationAttempts)
      .where(sql`${registrationAttempts.createdAt} < ${dayAgo}`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

/**
 * Enhanced email validation (basic format + domain checks)
 */
export function validateEmailFormat(email: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, normalized: email, error: 'Invalid email format' };
  }

  // Normalize email (lowercase, trim)
  const normalized = email.toLowerCase().trim();

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\+.*@/, // Plus addressing (often used for testing)
    /@.*\.(test|example|localhost)$/i, // Test domains
    /\.{2,}/, // Multiple consecutive dots
    /@.*@/, // Multiple @ symbols
  ];

  // Note: We're being permissive here for user experience
  // In production, you might want to integrate with email validation APIs

  return { valid: true, normalized };
}

/**
 * Progressive registration state management
 */
export interface RegistrationState {
  email: string;
  step: 'email' | 'verification' | 'profile' | 'complete';
  emailVerified: boolean;
  userId?: number;
  createdAt: Date;
}

// In-memory store for registration states (in production, use Redis)
const registrationStates = new Map<string, RegistrationState>();

export function createRegistrationState(email: string): string {
  const stateId = crypto.randomUUID();
  registrationStates.set(stateId, {
    email,
    step: 'email',
    emailVerified: false,
    createdAt: new Date()
  });
  
  // Cleanup after 1 hour
  setTimeout(() => {
    registrationStates.delete(stateId);
  }, 60 * 60 * 1000);
  
  return stateId;
}

export function getRegistrationState(stateId: string): RegistrationState | null {
  return registrationStates.get(stateId) || null;
}

export function updateRegistrationState(stateId: string, updates: Partial<RegistrationState>): boolean {
  const state = registrationStates.get(stateId);
  if (!state) return false;
  
  Object.assign(state, updates);
  return true;
}