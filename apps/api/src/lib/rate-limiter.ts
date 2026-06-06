/**
 * In-memory rate limiter for OTP-related endpoints.
 * Tracks requests per email to prevent abuse.
 * 
 * Limits:
 * - OTP send: max 3 per hour per email
 * - OTP verify attempts: max 5 per OTP (handled at DB level)
 * - Resend cooldown: 60 seconds between requests per email
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface CooldownEntry {
  lastSentAt: number;
}

// OTP send rate limiting: max 3 per hour per email
const otpSendMap = new Map<string, RateLimitEntry>();
const OTP_SEND_LIMIT = 3;
const OTP_SEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Resend cooldown: 60 seconds between requests
const resendCooldownMap = new Map<string, CooldownEntry>();
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  
  for (const [key, entry] of otpSendMap) {
    if (now - entry.windowStart > OTP_SEND_WINDOW_MS) {
      otpSendMap.delete(key);
    }
  }
  
  for (const [key, entry] of resendCooldownMap) {
    if (now - entry.lastSentAt > RESEND_COOLDOWN_MS * 2) {
      resendCooldownMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Check if the email has exceeded the OTP send rate limit (3 per hour).
 * @returns { allowed: boolean, remainingSeconds?: number }
 */
export function checkOtpSendRateLimit(email: string): { allowed: boolean; remainingSeconds?: number } {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = otpSendMap.get(key);

  if (!entry) {
    return { allowed: true };
  }

  // Window expired — reset
  if (now - entry.windowStart > OTP_SEND_WINDOW_MS) {
    otpSendMap.delete(key);
    return { allowed: true };
  }

  if (entry.count >= OTP_SEND_LIMIT) {
    const remainingMs = OTP_SEND_WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remainingSeconds: Math.ceil(remainingMs / 1000) };
  }

  return { allowed: true };
}

/**
 * Record an OTP send event for rate limiting tracking.
 */
export function recordOtpSend(email: string): void {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = otpSendMap.get(key);

  if (!entry || now - entry.windowStart > OTP_SEND_WINDOW_MS) {
    otpSendMap.set(key, { count: 1, windowStart: now });
  } else {
    entry.count++;
  }
}

/**
 * Check if the email is within the resend cooldown period (60 seconds).
 * @returns { allowed: boolean, remainingSeconds?: number }
 */
export function checkResendCooldown(email: string): { allowed: boolean; remainingSeconds?: number } {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = resendCooldownMap.get(key);

  if (!entry) {
    return { allowed: true };
  }

  const elapsed = now - entry.lastSentAt;
  if (elapsed < RESEND_COOLDOWN_MS) {
    return { allowed: false, remainingSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) };
  }

  return { allowed: true };
}

/**
 * Record a resend cooldown event.
 */
export function recordResendCooldown(email: string): void {
  const key = email.toLowerCase();
  resendCooldownMap.set(key, { lastSentAt: Date.now() });
}
