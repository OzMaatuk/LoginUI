import { storeOTP, verifyOTP as verifyOTPLib } from "@/lib/otp";
import redis from "@/lib/redis";

// Mock Redis
jest.mock("@/lib/redis", () => ({
  __esModule: true,
  default: {
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock NextAuth
jest.mock("@/auth", () => ({
  signIn: jest.fn(),
}));

describe("OTP Verification Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("OTP Storage", () => {
    it("should store OTP with correct TTL", async () => {
      const recipient = "test@example.com";
      const code = "123456";
      const channel = "email";

      await storeOTP(recipient, code, channel);

      expect(redis.setex).toHaveBeenCalledWith(
        `otp:${recipient}`,
        300,
        expect.stringContaining(code)
      );
    });
  });

  describe("OTP Verification", () => {
    it("should verify valid OTP", async () => {
      const recipient = "test@example.com";
      const code = "123456";

      (redis.get as jest.Mock)
        .mockResolvedValueOnce(null) // No attempts yet
        .mockResolvedValueOnce(
          JSON.stringify({
            code,
            recipient,
            channel: "email",
            createdAt: Date.now(),
          })
        );

      const result = await verifyOTPLib(recipient, code);

      expect(result.valid).toBe(true);
      expect(redis.del).toHaveBeenCalledWith(`otp:${recipient}`);
    });

    it("should reject invalid OTP", async () => {
      const recipient = "test@example.com";

      (redis.get as jest.Mock)
        .mockResolvedValueOnce(null) // No attempts yet
        .mockResolvedValueOnce(
          JSON.stringify({
            code: "123456",
            recipient,
            channel: "email",
            createdAt: Date.now(),
          })
        );

      const result = await verifyOTPLib(recipient, "wrong-code");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid OTP");
    });

    it("should reject expired OTP", async () => {
      const recipient = "test@example.com";

      (redis.get as jest.Mock)
        .mockResolvedValueOnce(null) // No attempts
        .mockResolvedValueOnce(null); // No OTP stored

      const result = await verifyOTPLib(recipient, "123456");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("expired");
    });

    it("should limit verification attempts", async () => {
      const recipient = "test@example.com";

      (redis.get as jest.Mock).mockResolvedValueOnce("5"); // Max attempts reached

      const result = await verifyOTPLib(recipient, "123456");

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Too many failed attempts");
    });
  });
});
