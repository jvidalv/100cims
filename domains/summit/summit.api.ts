import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { useRefreshOnFocus } from "@/hooks/use-refetch-on-focus";

export const useSummitsGet = ({
  mountainId,
  limit,
}: {
  mountainId?: string;
  limit?: number;
}) => {
  const { isAuthenticated } = useAuth();
  const api = useApiWithAuth();

  const args = useQuery({
    queryKey: ["summits", mountainId, limit],
    enabled: () => isAuthenticated,
    queryFn: () =>
      api.protected.mountain.summits.get({
        query: {
          mountainId,
          limit,
        },
      }),
  });

  useRefreshOnFocus(args.refetch);

  return args;
};
