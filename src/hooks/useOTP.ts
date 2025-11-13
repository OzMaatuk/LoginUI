import { useMutation } from "@tanstack/react-query";
import { api, handleApiError } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { OTPRequestPayload, OTPVerifyPayload, OTPResponse } from "@/types/auth";
import toast from "react-hot-toast";

export const useRequestOTP = () => {
  return useMutation({
    mutationFn: async (payload: OTPRequestPayload) => {
      const response = await api.post<OTPResponse>(
        "/auth/otp/request",
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "OTP sent to your email!");
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });
};

export const useVerifyOTP = () => {
  const { setUser: setStoreUser } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: OTPVerifyPayload) => {
      const response = await api.post<OTPResponse>("/auth/otp/verify", payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.access_token) {
        setToken(data.access_token);
        toast.success("OTP verified successfully!");
      }
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });
};
