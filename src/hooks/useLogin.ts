import { useMutation } from "@tanstack/react-query";
import { api, handleApiError } from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { LoginCredentials, LoginResponse } from "@/types/auth";
import toast from "react-hot-toast";

export const useLogin = () => {
  const { setUser: setStoreUser } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      setToken(data.access_token);
      if (data.user) {
        setUser(data.user);
        setStoreUser(data.user);
      }
      toast.success("Login successful!");
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });
};
