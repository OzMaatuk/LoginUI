import { useQuery } from "@tanstack/react-query";
import { api, handleApiError } from "@/lib/api";
import { User } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";

export const useProfile = () => {
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await api.get<User>("/auth/profile");
      setUser(response.data);
      return response.data;
    },
    retry: false,
  });
};
