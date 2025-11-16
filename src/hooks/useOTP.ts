import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface OTPSendPayload {
  recipient: string;
  channel: "email" | "sms";
}

interface OTPSendResponse {
  message: string;
  status: string;
  code?: string;
  messageId?: string;
}

export const useRequestOTP = () => {
  return useMutation({
    mutationFn: async (payload: OTPSendPayload) => {
      const response = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send OTP");
      }

      return response.json() as Promise<OTPSendResponse>;
    },
    onSuccess: (data) => {
      toast.success(data.message || "OTP sent successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send OTP");
    },
  });
};

interface OTPVerifyPayload {
  email: string;
  otp: string;
}

interface OTPVerifyResponse {
  message: string;
  status: string;
  user: {
    email: string;
  };
}

export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: async (payload: OTPVerifyPayload) => {
      const response = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: payload.email,
          code: payload.otp,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify OTP");
      }

      return response.json() as Promise<OTPVerifyResponse>;
    },
    onSuccess: (data) => {
      toast.success(data.message || "OTP verified successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to verify OTP");
    },
  });
};
