import redis from "./redis";

const OTP_PREFIX = "otp:";
const OTP_TTL = 300; // 5 minutes
const MAX_ATTEMPTS = 5;
const ATTEMPT_PREFIX = "otp_attempts:";

export interface OTPData {
  code: string;
  recipient: string;
  channel: "email" | "sms";
  createdAt: number;
}

/**
 * Store OTP code in Redis with TTL
 */
export async function storeOTP(
  recipient: string,
  code: string,
  channel: "email" | "sms"
): Promise<void> {
  const key = `${OTP_PREFIX}${recipient}`;
  const data: OTPData = {
    code,
    recipient,
    channel,
    createdAt: Date.now(),
  };

  await redis.setex(key, OTP_TTL, JSON.stringify(data));
}

/**
 * Verify OTP code and remove it if valid
 */
export async function verifyOTP(
  recipient: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const key = `${OTP_PREFIX}${recipient}`;
  const attemptKey = `${ATTEMPT_PREFIX}${recipient}`;

  // Check attempts
  const attempts = await redis.get(attemptKey);
  const attemptCount = attempts ? parseInt(attempts, 10) : 0;

  if (attemptCount >= MAX_ATTEMPTS) {
    return {
      valid: false,
      error: "Too many failed attempts. Please request a new OTP.",
    };
  }

  // Get stored OTP
  const storedData = await redis.get(key);

  if (!storedData) {
    return {
      valid: false,
      error: "OTP expired or not found. Please request a new one.",
    };
  }

  const otpData: OTPData = JSON.parse(storedData);

  // Verify code
  if (otpData.code !== code) {
    // Increment attempts
    await redis.setex(attemptKey, OTP_TTL, (attemptCount + 1).toString());
    return {
      valid: false,
      error: `Invalid OTP. ${MAX_ATTEMPTS - attemptCount - 1} attempts remaining.`,
    };
  }

  // Valid OTP - delete it and attempts
  await redis.del(key);
  await redis.del(attemptKey);

  return { valid: true };
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate recipient format
 */
export function validateRecipient(
  recipient: string,
  channel: "email" | "sms"
): boolean {
  if (channel === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(recipient);
  } else if (channel === "sms") {
    // E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(recipient);
  }
  return false;
}
