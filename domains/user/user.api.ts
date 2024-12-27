import { useAuth } from "@/components/providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";

export const useUserMe = () => {
  const { isAuthenticated } = useAuth();
  const api = useApiWithAuth();

  return useQuery({
    queryKey: ["me"],
    enabled: () => isAuthenticated,
    queryFn: () => api.protected.user.me.get(),
  });
};
