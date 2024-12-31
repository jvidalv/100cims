import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { useRefreshOnFocus } from "@/hooks/use-refetch-on-focus";

export const useUserMe = () => {
  const { isAuthenticated } = useAuth();
  const api = useApiWithAuth();

  const props = useQuery({
    queryKey: ["me"],
    enabled: () => isAuthenticated,
    queryFn: () => api.protected.user.me.get(),
  });

  return {
    ...props,
    data: props.data?.data?.message,
  };
};

export const useUsers = () => {
  const { isAuthenticated } = useAuth();
  const api = useApiWithAuth();

  return useQuery({
    queryKey: ["all"],
    enabled: () => isAuthenticated,
    queryFn: () => api.protected.user.all.get(),
  });
};

export const useUserSummits = () => {
  const { isAuthenticated } = useAuth();
  const api = useApiWithAuth();

  const props = useQuery({
    queryKey: ["summits"],
    enabled: () => isAuthenticated,
    queryFn: () => api.protected.user.summits.get(),
  });

  useRefreshOnFocus(props.refetch);

  return { ...props, data: props?.data?.data?.message };
};
