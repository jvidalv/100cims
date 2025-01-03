import { useQuery } from "@tanstack/react-query";

import { useRefreshOnFocus } from "@/hooks/use-refetch-on-focus";
import { api } from "@/lib";

export const useSummitsGet = ({
  mountainId,
  limit,
}: {
  mountainId?: string;
  limit?: number;
}) => {
  const args = useQuery({
    queryKey: ["summits", mountainId, limit],
    queryFn: () =>
      api.public.mountains.summits.get({
        query: {
          mountainId,
          limit,
        },
      }),
  });

  useRefreshOnFocus(args.refetch);

  return { ...args, data: args.data?.data?.message };
};
